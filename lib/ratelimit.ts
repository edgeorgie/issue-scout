type Bucket = { count: number; resetAt: number };

export const MAX_BUCKETS = 10_000;

const buckets = new Map<string, Bucket>();

function purge(now: number) {
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  while (buckets.size >= MAX_BUCKETS) {
    const oldest = buckets.keys().next().value;
    if (oldest === undefined) break;
    buckets.delete(oldest);
  }
}

export function bucketCount() {
  return buckets.size;
}

export function rateLimit(key: string, limit = 20, windowMs = 60_000, now = Date.now()) {
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    if (!b && buckets.size >= MAX_BUCKETS) purge(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, remaining: limit - b.count, retryAfter: 0 };
}
