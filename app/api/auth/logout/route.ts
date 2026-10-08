import { NextRequest, NextResponse } from "next/server";
import { TOKEN_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/", req.nextUrl.origin), 303);
  res.cookies.delete(TOKEN_COOKIE);
  return res;
}
