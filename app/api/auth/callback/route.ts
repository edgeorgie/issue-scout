import { NextRequest, NextResponse } from "next/server";
import { oauthConfigured, STATE_COOKIE, TOKEN_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const saved = req.cookies.get(STATE_COOKIE)?.value;
  if (!oauthConfigured() || !code || !state || state !== saved) {
    return NextResponse.redirect(new URL("/?auth=error", req.nextUrl.origin));
  }
  let data: { access_token?: string };
  try {
    const r = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    data = (await r.json()) as { access_token?: string };
  } catch {
    return NextResponse.redirect(new URL("/?auth=error", req.nextUrl.origin));
  }
  if (!data.access_token) return NextResponse.redirect(new URL("/?auth=error", req.nextUrl.origin));
  const res = NextResponse.redirect(new URL("/", req.nextUrl.origin));
  res.cookies.set(TOKEN_COOKIE, data.access_token, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 60 * 60 * 8, path: "/" });
  res.cookies.delete(STATE_COOKIE);
  return res;
}
