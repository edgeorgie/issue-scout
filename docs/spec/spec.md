# Specification: issue-scout

Find open source issues you can fix, ranked by repository health and contribution policy.

## Provenance

This project was built with AI assistance. The behavior was implemented and verified first, in the pull requests listed in `tasks.md`. This specification was written afterwards from the verified behavior (reverse specification, 2026-10-06). From this point every change follows the workflow in `AGENTS.md`: specification first, then plan, tasks, implementation and verification.

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

### FR-5 Optional GitHub sign-in

Status: Implemented, not verified end to end.

- Given OAuth credentials, when the user signs in, then requests use their token and the API limit rises; the token is stored in an httpOnly cookie.

### FR-6 AI plan of attack (bring your own key)

Status: Implemented, not verified end to end.

- Given a key, when the user asks for a plan, then the issue is fetched and a summary, difficulty and plan are shown; the key never reaches this app's server.

### FR-7 Filtering and sorting

Status: Verified.

- Given results, then they can be filtered by AI policy with counts and sorted by score or stars.

## Open risks

- In-memory rate limiting does not hold across instances.
- Small repositories can score high; the score measures process health, not project value.
