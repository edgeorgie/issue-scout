# ADR 0002: Cookieless product analytics, off until a key is set

Status: accepted

## Context

The owner runs several small apps and wants one place that answers which of them get used and how, without a cookie banner and without ever holding user content. This repository's rule is that keys and user data stay in the browser: the username typed into the search box, the issue text and the provider key must not reach an analytics vendor either. Analytics also has to cost nothing, in bytes and in requests, for a deployment that does not want it.

## Decision

PostHog through `posthog-js`, under these constraints:

- Off by default. Without `NEXT_PUBLIC_POSTHOG_KEY` the facade in `lib/analytics.ts` is a no-op, the SDK is left out of the client bundle, no request is made and the `/ingest` proxy route is not registered.
- Cookieless: `cookieless_mode: "always"`, `person_profiles: "never"`, no `identify()`. No cookies or storage, so no consent banner and no person data to protect. The cost is no identity across days, which this app does not need.
- Explicit events only: `autocapture: false`, session recording off, `respect_dnt: true`. The allowlist is `$pageview`, `search_run`, `issue_opened` and `policy_badge_viewed`. Properties are enums, counts, booleans, durations in milliseconds and public repository names. The username is never sent, not even its length; neither are issue titles, bodies, keys or tokens.
- Same-origin transport: with a key, `/ingest/*` is rewritten to PostHog in `next.config.ts`, so the browser only talks to this origin. Without a key `rewrites()` returns no rules.
- Every event carries `app: "issue-scout"` and `surface: "web"`, so one PostHog project can hold every app and dashboards can be copied between them.
- Client only. The scout route sees the same searches the browser does, plus the username, so a server-side event would add nothing except a path for user data to leave.

## Consequences

- One dependency, `posthog-js`, imported dynamically on idle only when the key is set.
- `skipTrailingSlashRedirect` is on so PostHog endpoints that end in `/` are not redirected; the app's own routes are unaffected.
- `/ingest/*` does not exist without a key. A rewrite is a server-side route that exists whether or not any client calls it, so registering it unconditionally would make every deployment an open relay: any body posted to `/ingest/*` would be forwarded to PostHog's public ingestion API from this origin, at this deployment's cost and attributed to it, even with analytics off and the SDK out of the bundle. `rewrites()` therefore returns `[]` unless `NEXT_PUBLIC_POSTHOG_KEY` is non-empty, and `/ingest/*` is a 404. With a key the route is public by necessity, as with any analytics proxy, and anyone who reads the public project token from the bundle can post events through it.
- The SDK's `ip` option is deprecated and has no effect; discarding IP data is a PostHog project setting and must be enabled there.
- The no-key path is verified by the build (`grep -r posthog .next/static` finds nothing) and by `tests/ingest-proxy.test.ts`, which calls the real `rewrites()` under an unset, an empty and a set key. Delivery with a real key is pending until a PostHog project exists.
