export class GitHubRateLimitError extends Error {
  constructor(public resetAt: number | null) {
    super("GitHub API rate limit reached");
  }
}

export class GitHubError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function gh<T>(path: string, token?: string | null): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate: 300 },
  });
  if (res.status === 403 || res.status === 429) {
    if (res.headers.get("x-ratelimit-remaining") === "0" || res.status === 429) {
      const reset = res.headers.get("x-ratelimit-reset");
      throw new GitHubRateLimitError(reset ? Number(reset) * 1000 : null);
    }
  }
  if (!res.ok) throw new GitHubError(res.status, `GitHub ${res.status} on ${path}`);
  return res.json() as Promise<T>;
}

export async function ghText(path: string, token?: string | null): Promise<string | null> {
  try {
    const f = await gh<{ content?: string; encoding?: string }>(path, token);
    if (f.content && f.encoding === "base64") return Buffer.from(f.content, "base64").toString("utf8");
    return null;
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return null;
    throw e;
  }
}
