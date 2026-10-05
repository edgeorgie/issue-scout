import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreRepo, responsivenessScore } from "../lib/scoring.ts";
import { detectAiPolicy } from "../lib/policy.ts";

const now = Date.parse("2026-01-01T00:00:00Z");

test("healthy repo scores high", () => {
  const s = scoreRepo(
    { pushedAt: "2025-12-30T00:00:00Z", externalPrMedianResponseHours: 10, hasContributing: true, issueHasOpenPr: false },
    now,
  );
  assert.equal(s.total, 100);
});

test("stale repo without contributing scores low", () => {
  const s = scoreRepo(
    { pushedAt: "2024-01-01T00:00:00Z", externalPrMedianResponseHours: 2000, hasContributing: false, issueHasOpenPr: false },
    now,
  );
  assert.equal(s.total, 20);
});

test("unknown responsiveness is neutral", () => {
  assert.equal(responsivenessScore(null), 8);
});

test("detects AI policy", () => {
  assert.equal(detectAiPolicy("We do not accept AI-generated code."), "forbidden");
  assert.equal(detectAiPolicy("Please disclose any use of AI assistants."), "disclosure");
  assert.equal(detectAiPolicy("Be nice."), "unknown");
  assert.equal(detectAiPolicy(null), "unknown");
});
