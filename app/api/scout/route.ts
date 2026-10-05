import { NextRequest, NextResponse } from "next/server";
import { scout } from "@/lib/scout";
import { GitHubError, GitHubRateLimitError } from "@/lib/github";
import { getUserToken } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

const USER_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,38})$/;

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = rateLimit(`scout:${ip}`);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }
  const user = req.nextUrl.searchParams.get("user") ?? "";
  if (!USER_RE.test(user)) return NextResponse.json({ error: "Invalid GitHub username" }, { status: 400 });

  const token = (await getUserToken()) ?? process.env.GITHUB_TOKEN ?? null;
  try {
    return NextResponse.json(await scout(user, token));
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
