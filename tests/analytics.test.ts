import assert from "node:assert/strict";
import { test } from "node:test";

// The facade reads the key when the module loads, so it is imported after the
// key is removed: this is the deployment without analytics that must stay silent.
delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
const analytics = await import("../lib/analytics.ts");

test("without a key the facade is disabled, track is a no-op and nothing loads", async () => {
  assert.equal(analytics.analyticsEnabled, false);
  assert.doesNotThrow(() => analytics.track("search_run", { outcome: "ok" }));
  assert.equal(await analytics.loadAnalytics(), null);
});

test("every event is tagged for the shared PostHog project through this origin", () => {
  assert.equal(analytics.APP, "issue-scout");
  assert.equal(analytics.ANALYTICS_HOST, "/ingest");
});

test("search outcomes are enums derived from the status, never messages", () => {
  assert.equal(analytics.searchOutcome(200), "ok");
  assert.equal(analytics.searchOutcome(400), "invalid");
  assert.equal(analytics.searchOutcome(404), "not_found");
  assert.equal(analytics.searchOutcome(429), "rate_limited");
  assert.equal(analytics.searchOutcome(500), "error");
  assert.equal(analytics.searchOutcome(502), "error");
});
