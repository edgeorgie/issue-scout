const SEGMENT_RE = /^(?!\.{1,2}$)[\w.-]{1,100}$/;

export function parseRepo(input: string): { owner: string; name: string } | null {
  const parts = input.split("/");
  if (parts.length !== 2 || !parts.every((p) => SEGMENT_RE.test(p))) return null;
  return { owner: parts[0], name: parts[1] };
}

export function repoPath(r: { owner: string; name: string }): string {
  return `/repos/${encodeURIComponent(r.owner)}/${encodeURIComponent(r.name)}`;
}

type Getter = <T>(path: string, token?: string | null) => Promise<T>;

export class PrivateRepoError extends Error {
  constructor() {
    super("Repository is not public");
  }
}

// With the server's own token the caller is anonymous, so only public repositories may be read.
export async function loadIssue(
  repo: { owner: string; name: string },
  number: number,
  get: Getter,
  tokens: { user: string | null; server: string | null },
): Promise<{ title: string; body: string }> {
  const token = tokens.user ?? tokens.server;
  const base = repoPath(repo);
  if (!tokens.user && tokens.server) {
    const meta = await get<{ private: boolean }>(base, tokens.server);
    if (meta.private !== false) throw new PrivateRepoError();
  }
  const i = await get<{ title: string; body: string | null }>(`${base}/issues/${number}`, token);
  return { title: i.title, body: (i.body ?? "").slice(0, 6000) };
}
