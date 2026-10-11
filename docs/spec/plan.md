# Plan: issue-scout

## Overview

The route detects the user's languages, searches issues, enriches each repository with health signals, scores it and returns ranked results. The client filters and sorts locally.

## Modules

| Path | Responsibility |
|---|---|
| `lib/scout.ts` | Orchestrates language detection and issue search |
| `lib/github.ts` | GitHub API client |
| `lib/scoring.ts` | Score weights |
| `lib/policy.ts` | AI policy classifier |
| `lib/ratelimit.ts` | Per-client limiter |
| `lib/auth.ts` | OAuth helpers |
| `app/api/` | Route handlers |
| `lib/analytics.ts` | Analytics facade: no-op without `NEXT_PUBLIC_POSTHOG_KEY`, cookieless PostHog through `/ingest` with it |
| `components/Analytics.tsx` | Manual `$pageview` on load and route change; renders nothing without a key |
| `instrumentation-client.ts` | Loads the analytics SDK on idle, only when a key is set |
| `next.config.ts` | `/ingest` rewrites to PostHog, registered only when `NEXT_PUBLIC_POSTHOG_KEY` is set; otherwise the route does not exist |

## Decisions

- [ADR 0001: Heuristic score, not a model](../adr/0001-heuristic-score-not-a-model.md)
- [ADR 0002: Cookieless product analytics, off until a key is set](../adr/0002-cookieless-product-analytics.md)

## Dependencies

- `posthog-js` (FR-9, ADR 0002): imported dynamically and only when `NEXT_PUBLIC_POSTHOG_KEY` is set, so a deployment without analytics ships none of it.

## Quality gates

`npm run verify`: typecheck, lint, spec check, tests and production build.
