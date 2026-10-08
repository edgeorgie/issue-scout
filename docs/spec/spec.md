# Specification: issue-scout

Find open source issues you can fix, ranked by repository health and contribution policy.

## Baseline

This specification describes the behavior verified for the 0.1.0 baseline (2026-10-06) and is the source of truth from here on. Every change starts in this document and follows the workflow in `AGENTS.md`.

## Users

Developers looking for worthwhile open source contributions.

## Goals

- Rank issues by signals that predict a good contribution experience.
- Surface each project's stance on AI-assisted contributions.
- Stay usable without sign-in.

## Non-goals

- Posting comments or claiming issues.
- Tracking contributions over time.

## Requirements

### FR-1 Scout by username

Status: Verified.

- Given a GitHub username, then the languages they use are detected and open, unassigned issues in matching repositories are listed.

### FR-2 Repository health score

Status: Verified.

- Given activity, maintainer response time to outsiders, a CONTRIBUTING file and whether the issue has an open PR, then a 0 to 100 score is computed with the documented weights (30, 35, 15, 20).

### FR-3 AI policy detection

Status: Verified.

- Given contributing text, then the policy is classified as forbidden, disclosure, allowed or unknown.

### FR-4 Rate limiting and API limits

Status: Implemented, not verified end to end.

- Given repeated requests from one client, then requests beyond the limit are rejected; given GitHub rate limiting, then a clear error is shown.
- The client key comes only from the platform header (`x-vercel-forwarded-for` on Vercel); elsewhere all callers share one key, so a forged `X-Forwarded-For` cannot create new buckets. The bucket map is bounded and purged, there is a global limit for anonymous scouts, and scout results are cached for five minutes per user.
- Given the server token and a private repository, `/api/issue` answers 403; the `repo` parameter rejects `.` and `..` segments.

### FR-5 Optional GitHub sign-in

Status: Implemented, not verified end to end.

- Given OAuth credentials, when the user signs in, then requests use their token and the API limit rises; the token is stored in an httpOnly cookie. Sign-in requests no scope (read access to public data only); a failed or non-JSON token exchange redirects to `/?auth=error`.

### FR-6 AI plan of attack (bring your own key)

Status: Implemented, not verified end to end.

- Given a key, when the user asks for a plan, then the issue is fetched and a summary, difficulty and plan are shown; the key never reaches this app's server.

### FR-7 Filtering and sorting

Status: Verified.

- Given results, then they can be filtered by AI policy with counts and sorted by score or stars.

### FR-8 Provider key kept in the session by default

Status: Implemented, not verified end to end.

- Given a provider key, then it is kept in sessionStorage for the tab by default, kept on the device only when the user ticks "Remember on this device", and removable with "Clear key"; the provider choice persists.

## Open risks

- In-memory rate limiting and caching do not hold across instances; the global limit is per instance.
- Small repositories can score high; the score measures process health, not project value.
