import assert from "node:assert/strict";
import { test } from "node:test";

// The /ingest proxy is a SERVER-side route, so no client-side gate can close
// it: registered unconditionally, the deployment forwards any body posted to
// /ingest/* to PostHog's public ingestion API whether or not a key is set and
// whatever the bundle contains. That is an open relay attributed to this
// origin.
//
// Asserting on the SOURCE of next.config.ts cannot prove a route is absent, so
// these tests import the real config and call its own rewrites() under each
// environment. The CI step that checks the bundle covers the client half; a
// clean bundle says nothing about the proxy.

type Rewrite = { source: string; destination: string };

let loads = 0;

async function rewritesWith(key: string | undefined): Promise<Rewrite[]> {
  const previous = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (key === undefined) delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  else process.env.NEXT_PUBLIC_POSTHOG_KEY = key;
  try {
    // The gate is evaluated when the config module loads, so each run needs a
    // fresh module instance; a unique query string bypasses the module cache.
    const mod = await import(`../next.config.ts?load=${loads++}`);
    const config = mod.default as { rewrites?: () => Promise<Rewrite[]> };
    assert.equal(typeof config.rewrites, "function");
    return await config.rewrites!();
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    else process.env.NEXT_PUBLIC_POSTHOG_KEY = previous;
  }
}

test("registers no rewrite at all when no key is set", async () => {
  assert.deepEqual(await rewritesWith(undefined), []);
});

test('treats an empty key as unset (next.config.ts defines it as "")', async () => {
  assert.deepEqual(await rewritesWith(""), []);
});

test("proxies to PostHog only when a key is set, catch-all last", async () => {
  const rewrites = await rewritesWith("phc_test_key");
  assert.deepEqual(
    rewrites.map((r) => r.source),
    ["/ingest/static/:path*", "/ingest/array/:path*", "/ingest/:path*"],
  );
  // Every destination must stay on PostHog's own hosts: a typo'd or
  // attacker-supplied destination would make the relay worse, not better, than
  // the ungated version.
  for (const r of rewrites) {
    assert.match(new URL(r.destination).hostname, /\.i\.posthog\.com$/);
  }
  // The catch-all must be last, or /ingest/static/* would be swallowed by it
  // and the SDK assets would 404.
  assert.equal(rewrites[rewrites.length - 1].source, "/ingest/:path*");
});
