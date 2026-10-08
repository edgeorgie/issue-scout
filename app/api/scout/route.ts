import { NextRequest, NextResponse } from "next/server";
import { scout } from "@/lib/scout";
import { GitHubError, GitHubRateLimitError } from "@/lib/github";
import { getUserToken } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { clientKey } from "@/lib/clientip";
import { TtlCache } from "@/lib/cache";

type Scouted = Awaited<ReturnType<typeof scout>>;
const cache = new TtlCache<Scouted>(5 * 60_000, 500);

const USER_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/;

export async function GET(req: NextRequest) {
  const rl = rateLimit(`scout:${clientKey(req.headers)}`);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }
  const user = req.nextUrl.searchParams.get("user") ?? "";
  if (!USER_RE.test(user)) return NextResponse.json({ error: "Invalid GitHub username" }, { status: 400 });

  const userToken = await getUserToken();
  const cacheKey = `${userToken ? "u" : "s"}:${user.toLowerCase()}`;
  if (!userToken) {
    const hit = cache.get(cacheKey);
    if (hit) return NextResponse.json(hit);
    const global = rateLimit("scout:global", 60);
    if (!global.ok) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(global.retryAfter) } });
    }
  }
  const token = userToken ?? process.env.GITHUB_TOKEN ?? null;
  try {
    const result = await scout(user, token);
    if (!userToken) cache.set(cacheKey, result);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof GitHubRateLimitError) {
      return NextResponse.json({ error: "GitHub API rate limit reached", resetAt: e.resetAt }, { status: 429 });
    }
    if (e instanceof GitHubError) {
      return NextResponse.json({ error: e.status === 404 ? "User not found" : "GitHub error" }, { status: e.status === 404 ? 404 : 502 });
    }
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
