import { NextRequest, NextResponse } from "next/server";
import { gh } from "@/lib/github";
import { getUserToken } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";

const REPO_RE = /^[\w.-]+\/[\w.-]+$/;

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`issue:${ip}`, 30).ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const repo = req.nextUrl.searchParams.get("repo") ?? "";
  const number = Number(req.nextUrl.searchParams.get("number"));
  if (!REPO_RE.test(repo) || !Number.isInteger(number) || number < 1) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }
  try {
    const token = (await getUserToken()) ?? process.env.GITHUB_TOKEN ?? null;
    const i = await gh<{ title: string; body: string | null }>(`/repos/${repo}/issues/${number}`, token);
    return NextResponse.json({ title: i.title, body: (i.body ?? "").slice(0, 6000) });
  } catch {
    return NextResponse.json({ error: "Could not load issue" }, { status: 502 });
  }
}
