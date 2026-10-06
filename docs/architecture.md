# Architecture

## Data flow

```mermaid
flowchart LR
  U[Username] --> L[Detect languages]
  L --> S[Search issues]
  S --> H[Repo health signals]
  H --> K[Score 0 to 100]
  S --> P[AI policy detection]
  K --> R[Ranked results]
  P --> R
```

## Main sequence

```mermaid
sequenceDiagram
  participant B as Browser
  participant API as scout route
  participant G as GitHub API
  B->>API: GET /api/scout?user=
  API->>G: repos and languages
  API->>G: search issues
  API->>G: repo signals and CONTRIBUTING
  API-->>B: ranked results
```

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

## Principles

- Pure logic lives in `lib/` and is tested without a browser; components stay thin.
- Network, storage and model replies are validated at the boundary.
- Secrets and user content stay in the browser.

## Decisions

- [Heuristic score, not a model](adr/0001-heuristic-score-not-a-model.md)
