# Traceability: issue-scout

Every requirement maps to implementation files and to tests or manual evidence. `npm run spec:check` enforces that each requirement has an implementation, that files exist, and that there is a test or a manual note.

| Requirement | Implementation | Tests | Evidence | Status |
|---|---|---|---|---|
| FR-1 | `lib/scout.ts`, `lib/github.ts`, `app/api/scout/route.ts` | manual | manual: PR 1 and PR 2, the real GitHub API returned 21 opportunities for a sample user. | Verified |
| FR-2 | `lib/scoring.ts` | `tests/scoring.test.ts` | PR 1: scoring tests. | Verified |
| FR-3 | `lib/policy.ts` | `tests/scoring.test.ts` | PR 1: policy tests. | Verified |
| FR-4 | `lib/ratelimit.ts`, `lib/clientip.ts`, `lib/cache.ts`, `lib/repo.ts`, `app/api/scout/route.ts`, `app/api/issue/route.ts` | `tests/abuse-controls.test.ts` | manual: PR 1, limiter exercised through the route. In-memory only, so it resets per server instance. | Implemented, not verified end to end |
| FR-5 | `lib/auth.ts`, `app/api/auth/login/route.ts`, `app/api/auth/callback/route.ts`, `app/api/auth/logout/route.ts`, `app/api/auth/me/route.ts` | manual | manual: implemented in PR 1; awaiting an OAuth App to verify the full round trip. | Implemented, not verified end to end |
| FR-6 | `lib/llm.ts`, `components/AnalyzeButton.tsx`, `components/LlmSettings.tsx`, `app/api/issue/route.ts` | manual | manual: PR 1; not run against a real provider. | Implemented, not verified end to end |
| FR-7 | `app/page.tsx` | manual | manual: PR 2, filter and sort verified in Chrome with real data. | Verified |
| FR-8 | `lib/keystore.ts`, `components/KeyNotes.tsx`, `components/LlmSettings.tsx` | `tests/keystore.test.ts` | Key store tests; typecheck and build (SEC-002). Not exercised in a browser while Backend changes to the app are in flight. | Implemented, not verified end to end |

"Verified" means the behavior was exercised. "Implemented, not verified end to end" means the code exists and its parts are tested, but a real external service or credential was not available.
