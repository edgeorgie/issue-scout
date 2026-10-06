"use client";

import { useEffect, useMemo, useState } from "react";
import AnalyzeButton from "@/components/AnalyzeButton";
import LlmSettings, { loadConfig, type LlmConfig } from "@/components/LlmSettings";

type Result = {
  issue: { number: number; title: string; url: string; labels: string[]; comments: number };
  repo: { name: string; stars: number; score: { total: number }; aiPolicy: string; hasContributing: boolean };
};

type Policy = "forbidden" | "disclosure" | "allowed" | "unknown";

const POLICY: Record<Policy, { label: string; hint: string; chip: string }> = {
  allowed: { label: "AI welcome", hint: "The contributing docs mention AI assistance without restricting it.", chip: "bg-go-soft text-go" },
  unknown: { label: "No AI policy", hint: "No policy found in the contributing docs. Check before you submit.", chip: "bg-ink/5 text-ink-soft" },
  disclosure: { label: "Disclose AI use", hint: "The project asks you to disclose AI assistance.", chip: "bg-warn-soft text-[#8a5a00]" },
  forbidden: { label: "AI not accepted", hint: "The project does not accept AI-assisted contributions.", chip: "bg-stop-soft text-stop" },
};

const FILTERS: { key: "all" | Policy; label: string }[] = [
  { key: "all", label: "All" },
  { key: "allowed", label: "AI welcome" },
  { key: "unknown", label: "No policy" },
  { key: "disclosure", label: "Disclose" },
  { key: "forbidden", label: "Not accepted" },
];

function band(score: number) {
  return score >= 70 ? { color: "var(--go)", text: "text-go", word: "Strong" } : score >= 45 ? { color: "var(--warn)", text: "text-[#b57800]", word: "Decent" } : { color: "var(--stop)", text: "text-stop", word: "Risky" };
}

function Dial({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const b = band(score);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(score), 60);
    return () => clearTimeout(t);
  }, [score]);
  return (
    <div className="relative grid h-24 w-24 shrink-0 place-items-center" aria-label={`Score ${score} of 100, ${b.word}`}>
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={b.color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)} className="meter-fill" />
      </svg>
      <span className={`board absolute text-[40px] font-black ${b.text}`}>{score}</span>
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llm, setLlm] = useState<LlmConfig>({ provider: "anthropic", key: "" });
  const [me, setMe] = useState<{ login: string | null; oauth: boolean }>({ login: null, oauth: false });
  const [data, setData] = useState<{ languages: string[]; results: Result[] } | null>(null);
  const [asked, setAsked] = useState("");
  const [filter, setFilter] = useState<"all" | Policy>("all");
  const [sort, setSort] = useState<"score" | "stars">("score");

  useEffect(() => {
    Promise.resolve().then(() => setLlm(loadConfig()));
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setMe)
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = user.trim().replace(/^@/, "");
    setLoading(true);
    setError(null);
    setData(null);
    setFilter("all");
    setAsked(name);
    try {
      const res = await fetch(`/api/scout?user=${encodeURIComponent(name)}`);
      const body = await res.json();
      if (!res.ok) setError(body.error ?? "Request failed");
      else setData(body);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data?.results.length ?? 0 };
    for (const r of data?.results ?? []) c[r.repo.aiPolicy] = (c[r.repo.aiPolicy] ?? 0) + 1;
    return c;
  }, [data]);

  const rows = useMemo(() => {
    const list = (data?.results ?? []).filter((r) => filter === "all" || r.repo.aiPolicy === filter);
    return [...list].sort((a, b) => (sort === "score" ? b.repo.score.total - a.repo.score.total : b.repo.stars - a.repo.stars));
  }, [data, filter, sort]);

  return (
    <div className="min-h-screen">
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
          <span className="board text-3xl font-black tracking-wide">
            Issue <span className="text-warn">Scout</span>
          </span>
          <div className="flex items-center gap-3 text-sm">
            {me.oauth &&
              (me.login ? (
                <form action="/api/auth/logout" method="post" className="text-white/70">
                  @{me.login} <button className="ml-1 underline underline-offset-4 hover:text-white">sign out</button>
                </form>
              ) : (
                <a href="/api/auth/login" className="rounded-full border border-white/30 px-4 py-1.5 font-semibold transition hover:bg-white hover:text-navy">
                  Sign in for more API calls
                </a>
              ))}
            <LlmSettings value={llm} onChange={setLlm} />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 pb-14 pt-10 sm:px-10">
          <h1 className="board text-[3.6rem] font-black sm:text-[7rem] lg:text-[9rem]">
            Find issues
            <br />
            <span className="text-warn">worth your weekend.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/70">Open, unassigned issues in healthy repos that match the languages you already write. Scored on activity, how fast maintainers answer outsiders, and what the project says about AI.</p>
          <form onSubmit={submit} className="mt-9 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="user">GitHub username</label>
            <div className="flex flex-1 items-center border-2 border-white bg-white px-4 text-ink shadow-[6px_6px_0_0_var(--warn)] transition focus-within:shadow-[8px_8px_0_0_var(--go)]">
              <span className="font-mono text-ink-soft">@</span>
              <input
                id="user"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="your-github-username"
                className="w-full bg-transparent px-2 py-4 font-mono text-lg outline-none placeholder:text-ink-soft/50"
                autoFocus
              />
            </div>
            <button disabled={loading || !user.trim()} className="board bg-warn px-9 py-4 text-3xl font-black text-ink transition hover:-translate-y-0.5 hover:bg-white active:translate-y-0 disabled:opacity-50">
              {loading ? "Scouting" : "Scout"}
            </button>
          </form>
          {error && <p className="mt-5 inline-block bg-stop px-4 py-2 text-sm font-bold">{error}</p>}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-10 sm:px-10">
        {loading && (
          <div className="space-y-4" aria-busy>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-32 rounded-sm" style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </div>
        )}

        {data && (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">For @{asked}</p>
                <h2 className="board mt-1 text-5xl font-black">
                  {data.results.length} {data.results.length === 1 ? "opportunity" : "opportunities"}
                </h2>
                <p className="mt-2 text-sm text-ink-soft">Languages detected: {data.languages.join(", ") || "none"}</p>
              </div>
              <div className="flex items-center gap-1 rounded-full border-2 border-ink bg-card p-1 text-xs font-bold">
                {(["score", "stars"] as const).map((s) => (
                  <button key={s} onClick={() => setSort(s)} className={`rounded-full px-3.5 py-1.5 transition ${sort === s ? "bg-ink text-white" : "text-ink-soft hover:text-ink"}`}>
                    {s === "score" ? "Best score" : "Most stars"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {FILTERS.filter((f) => f.key === "all" || counts[f.key]).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full border-2 px-4 py-1.5 text-[13px] font-bold transition hover:-translate-y-0.5 ${filter === f.key ? "border-ink bg-ink text-white" : "border-ink/20 bg-card"}`}
                >
                  {f.label} <span className="font-mono text-[11px] opacity-60">{counts[f.key] ?? 0}</span>
                </button>
              ))}
            </div>

            <ul className="mt-7 space-y-4">
              {rows.map((r, i) => {
                const p = POLICY[(r.repo.aiPolicy as Policy) ?? "unknown"] ?? POLICY.unknown;
                return (
                  <li key={r.issue.url} className="row-in group border-2 border-ink bg-card p-5 shadow-[6px_6px_0_0_var(--ink)] transition hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_var(--ink)]" style={{ animationDelay: `${Math.min(i, 10) * 60}ms` }}>
                    <div className="flex gap-5">
                      <Dial score={r.repo.score.total} />
                      <div className="min-w-0 flex-1">
                        <a href={r.issue.url} target="_blank" rel="noreferrer" className="block text-xl font-bold leading-snug decoration-go decoration-2 underline-offset-4 hover:underline">
                          {r.issue.title}
                        </a>
                        <p className="mt-1 font-mono text-[13px] text-ink-soft">
                          {r.repo.name} &middot; &#9733; {r.repo.stars.toLocaleString()} &middot; {r.issue.comments} comments
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span title={p.hint} className={`rounded-full px-3 py-1 text-xs font-bold ${p.chip}`}>{p.label}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${r.repo.hasContributing ? "bg-go-soft text-go" : "bg-ink/5 text-ink-soft"}`}>
                            {r.repo.hasContributing ? "Has CONTRIBUTING" : "No CONTRIBUTING"}
                          </span>
                          {r.issue.labels.slice(0, 3).map((l) => (
                            <span key={l} className="rounded-full border border-line px-3 py-1 text-xs text-ink-soft">{l}</span>
                          ))}
                        </div>
                        <AnalyzeButton repo={r.repo.name} number={r.issue.number} config={llm} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {rows.length === 0 && <p className="mt-8 text-ink-soft">{data.results.length ? "Nothing matches this filter." : "No matching issues found for these languages."}</p>}
          </section>
        )}
      </main>
    </div>
  );
}
