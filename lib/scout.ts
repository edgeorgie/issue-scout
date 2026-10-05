import { gh, ghText, GitHubRateLimitError } from "./github";
import { scoreRepo, type ScoreBreakdown } from "./scoring";
import { detectAiPolicy, type AiPolicy } from "./policy";

type GhRepo = { full_name: string; language: string | null; fork: boolean; pushed_at: string; stargazers_count: number; archived: boolean };
type GhIssue = { number: number; title: string; html_url: string; repository_url: string; created_at: string; comments: number; labels: { name: string }[] };
type GhPull = { created_at: string; closed_at: string | null; author_association: string };

export type ScoutResult = {
  issue: { number: number; title: string; url: string; labels: string[]; comments: number };
  repo: { name: string; stars: number; score: ScoreBreakdown; aiPolicy: AiPolicy; hasContributing: boolean };
};

const INTERNAL = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

export async function detectLanguages(user: string, token?: string | null): Promise<string[]> {
  const repos = await gh<GhRepo[]>(`/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed`, token);
  const counts = new Map<string, number>();
  for (const r of repos) if (!r.fork && r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l]) => l);
}

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

async function repoSignals(fullName: string, token?: string | null) {
  const [repo, contributing, agents, pulls] = await Promise.all([
    gh<GhRepo>(`/repos/${fullName}`, token),
    ghText(`/repos/${fullName}/contents/CONTRIBUTING.md`, token),
    ghText(`/repos/${fullName}/contents/AGENTS.md`, token),
    gh<GhPull[]>(`/repos/${fullName}/pulls?state=closed&per_page=20`, token).catch(() => [] as GhPull[]),
  ]);
  const hours = pulls
    .filter((p) => p.closed_at && !INTERNAL.has(p.author_association))
    .map((p) => (new Date(p.closed_at!).getTime() - new Date(p.created_at).getTime()) / 3_600_000);
  const hasContributing = contributing !== null;
  return {
    repo,
    hasContributing,
    aiPolicy: detectAiPolicy([contributing, agents].filter(Boolean).join("\n") || null),
    score: scoreRepo({
      pushedAt: repo.pushed_at,
      externalPrMedianResponseHours: median(hours),
      hasContributing,
      issueHasOpenPr: false,
    }),
  };
}

export async function scout(user: string, token?: string | null): Promise<{ languages: string[]; results: ScoutResult[] }> {
  const languages = await detectLanguages(user, token);
  if (!languages.length) return { languages, results: [] };
  const langQ = languages.map((l) => `language:"${l}"`).join(" ");
  const q = `${langQ} state:open type:issue no:assignee -linked:pr archived:false label:"good first issue" comments:<4`;
  const found = await gh<{ items: GhIssue[] }>(`/search/issues?q=${encodeURIComponent(q)}&sort=updated&per_page=30`, token);

  const names = [...new Set(found.items.map((i) => i.repository_url.replace("https://api.github.com/repos/", "")))].slice(0, 12);
  const signals = new Map<string, Awaited<ReturnType<typeof repoSignals>>>();
  await Promise.all(
    names.map(async (n) => {
      try {
        signals.set(n, await repoSignals(n, token));
      } catch (e) {
        if (e instanceof GitHubRateLimitError) throw e;
      }
    }),
  );

  const results: ScoutResult[] = [];
  for (const i of found.items) {
    const name = i.repository_url.replace("https://api.github.com/repos/", "");
    const s = signals.get(name);
    if (!s || s.repo.archived) continue;
    results.push({
      issue: { number: i.number, title: i.title, url: i.html_url, labels: i.labels.map((l) => l.name), comments: i.comments },
      repo: { name, stars: s.repo.stargazers_count, score: s.score, aiPolicy: s.aiPolicy, hasContributing: s.hasContributing },
    });
  }
  results.sort((a, b) => b.repo.score.total - a.repo.score.total);
  return { languages, results };
}
