import { cookies } from "next/headers";

export const TOKEN_COOKIE = "gh_token";
export const STATE_COOKIE = "gh_oauth_state";

export async function getUserToken(): Promise<string | null> {
  return (await cookies()).get(TOKEN_COOKIE)?.value ?? null;
}

export function oauthConfigured(): boolean {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}
