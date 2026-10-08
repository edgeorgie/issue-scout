import { test } from "node:test";
import assert from "node:assert/strict";
import { rateLimit, bucketCount, MAX_BUCKETS } from "../lib/ratelimit.ts";
import { clientKey } from "../lib/clientip.ts";
import { parseRepo, loadIssue, PrivateRepoError, repoPath } from "../lib/repo.ts";
import { TtlCache } from "../lib/cache.ts";

const h = (o: Record<string, string>) => ({ get: (n: string) => o[n.toLowerCase()] ?? null });

test("clientKey ignores a spoofed X-Forwarded-For off platform", () => {
  const a = clientKey(h({ "x-forwarded-for": "1.1.1.1" }), {});
  const b = clientKey(h({ "x-forwarded-for": "2.2.2.2" }), {});
  assert.equal(a, b);
  assert.equal(clientKey(h({ "x-vercel-forwarded-for": "3.3.3.3" }), {}), "shared");
});

test("clientKey uses the platform header on Vercel and validates it", () => {
  assert.equal(clientKey(h({ "x-vercel-forwarded-for": "3.3.3.3, 9.9.9.9" }), { VERCEL: "1" }), "3.3.3.3");
  assert.equal(clientKey(h({ "x-vercel-forwarded-for": "<script>" }), { VERCEL: "1" }), "shared");
  assert.equal(clientKey(h({}), { VERCEL: "1" }), "shared");
});

test("one stable key hits the limit even with rotating forwarded headers", () => {
  let ok = 0;
  for (let i = 0; i < 30; i++) if (rateLimit(`t:${clientKey(h({ "x-forwarded-for": `9.9.9.${i}` }), {})}`, 20, 60_000, 1000).ok) ok++;
  assert.equal(ok, 20);
});

test("bucket map stays bounded and purges expired entries", () => {
  for (let i = 0; i < MAX_BUCKETS + 5000; i++) rateLimit(`flood:${i}`, 20, 60_000, 1000);
  assert.ok(bucketCount() <= MAX_BUCKETS);
  rateLimit("later", 20, 60_000, 1000 + 120_000);
  assert.ok(bucketCount() <= MAX_BUCKETS);
});

test("TtlCache expires and is bounded", () => {
  const c = new TtlCache<number>(1000, 3);
  for (let i = 0; i < 10; i++) c.set(`k${i}`, i, 0);
  assert.equal(c.size, 3);
  assert.equal(c.get("k9", 500), 9);
  assert.equal(c.get("k9", 1500), undefined);
});

test("parseRepo rejects dot segments and odd shapes", () => {
  for (const bad of ["../x", "x/..", "../..", "./x", "a/b/c", "a", "", "a/b%2e", "a b/c", "a/" + "x".repeat(101)]) {
    assert.equal(parseRepo(bad), null, bad);
  }
  assert.deepEqual(parseRepo("vercel/next.js"), { owner: "vercel", name: "next.js" });
  assert.equal(repoPath({ owner: "a", name: "b" }), "/repos/a/b");
});

test("server token never reads a private repository", async () => {
  const calls: string[] = [];
  const get = (async (path: string) => {
    calls.push(path);
    if (path === "/repos/o/priv") return { private: true };
    if (path === "/repos/o/pub") return { private: false };
    return { title: "t", body: "b".repeat(7000) };
  }) as never;
  await assert.rejects(loadIssue({ owner: "o", name: "priv" }, 1, get, { user: null, server: "srv" }), PrivateRepoError);
  assert.deepEqual(calls, ["/repos/o/priv"]);
  const ok = await loadIssue({ owner: "o", name: "pub" }, 1, get, { user: null, server: "srv" });
  assert.equal(ok.body.length, 6000);
});

test("a signed-in user's own token is not subject to the public check", async () => {
  const calls: string[] = [];
  const get = (async (path: string) => {
    calls.push(path);
    return { title: "t", body: null };
  }) as never;
  const r = await loadIssue({ owner: "o", name: "priv" }, 2, get, { user: "usr", server: "srv" });
  assert.deepEqual(calls, ["/repos/o/priv/issues/2"]);
  assert.equal(r.body, "");
});
