import { NextResponse } from "next/server";
import { getUserToken, oauthConfigured } from "@/lib/auth";
import { gh } from "@/lib/github";

export async function GET() {
  const token = await getUserToken();
  if (!token) return NextResponse.json({ login: null, oauth: oauthConfigured() });
  try {
    const u = await gh<{ login: string }>("/user", token);
    return NextResponse.json({ login: u.login, oauth: true });
  } catch {
    return NextResponse.json({ login: null, oauth: oauthConfigured() });
  }
}
