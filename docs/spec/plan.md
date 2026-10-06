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

## Decisions

- [ADR 0001: Heuristic score, not a model](../adr/0001-heuristic-score-not-a-model.md)

## Quality gates

`npm run verify`: typecheck, lint, spec check, tests and production build.
