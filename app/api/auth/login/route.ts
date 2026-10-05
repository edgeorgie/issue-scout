import { NextRequest, NextResponse } from "next/server";
import { oauthConfigured, STATE_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!oauthConfigured()) return NextResponse.json({ error: "OAuth not configured" }, { status: 503 });
  const state = crypto.randomUUID();
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID!);
  url.searchParams.set("redirect_uri", `${req.nextUrl.origin}/api/auth/callback`);
  url.searchParams.set("scope", "public_repo");
  url.searchParams.set("state", state);
  const res = NextResponse.redirect(url);
  res.cookies.set(STATE_COOKIE, state, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 600, path: "/" });
  return res;
}
