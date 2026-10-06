type HeaderReader = { get(name: string): string | null };

const IP_RE = /^[0-9a-fA-F:.]{3,45}$/;

// Only a header set by the hosting platform is trusted. Elsewhere a client can send any
// X-Forwarded-For, so every caller shares one stable key instead of a spoofable one.
export function clientKey(headers: HeaderReader, env: Record<string, string | undefined> = process.env): string {
  if (env.VERCEL) {
    const ip = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
    if (ip && IP_RE.test(ip)) return ip;
  }
  return "shared";
}
