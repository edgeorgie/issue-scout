import { NextRequest, NextResponse } from "next/server";
import { gh } from "@/lib/github";
import { clientKey } from "@/lib/clientip";
import { parseRepo, loadIssue, PrivateRepoError } from "@/lib/repo";
import { getUserToken } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  if (!rateLimit(`issue:${clientKey(req.headers)}`, 30).ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const repo = parseRepo(req.nextUrl.searchParams.get("repo") ?? "");
  const number = Number(req.nextUrl.searchParams.get("number"));
  if (!repo || !Number.isInteger(number) || number < 1) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  try {
    const issue = await loadIssue(repo, number, gh, { user: await getUserToken(), server: process.env.GITHUB_TOKEN ?? null });
    return NextResponse.json(issue);
  } catch (e) {
    if (e instanceof PrivateRepoError) return NextResponse.json({ error: "Repository is not public" }, { status: 403 });
    return NextResponse.json({ error: "Could not load issue" }, { status: 502 });
  }
}
