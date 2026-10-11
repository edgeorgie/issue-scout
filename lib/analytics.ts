/**
 * Thin analytics facade (PostHog), the same shape as the owner's other apps.
 *
 * - No key: `track()` is a no-op and posthog-js is never downloaded.
 *   next.config.ts defines the key as "" when unset and the gate below reads
 *   it straight from `process.env`, so the bundler sees a literal, proves the
 *   dynamic import unreachable and leaves the SDK out of the build.
 * - With a key: the SDK is imported after hydration, off the critical path;
 *   events queued before it loads are flushed in order.
 * - Cookieless: no cookies, no storage, no consent banner. PostHog derives a
 *   daily anonymous id server-side; `identify()` is never called.
 * - Transport goes through this origin (`/ingest`, see next.config.ts), so
 *   the browser never talks to a third-party host and tracking blockers that
 *   filter by domain do not drop it.
 * - Every event carries `app` and `surface` so one PostHog project can hold
 *   every app. Never send user content: not the username, not issue text,
 *   not the provider key. Only enums, counts, booleans, durations and public
 *   repository names.
 *
 * See docs/adr/0002-cookieless-product-analytics.md.
 */
import type { PostHog } from "posthog-js";

type Props = Record<string, string | number | boolean | null | undefined>;

export const analyticsEnabled = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
/** The `app` super property; the same PostHog project holds every app. */
export const APP = "issue-scout";
/** Same-origin path proxied to PostHog by next.config.ts rewrites. */
export const ANALYTICS_HOST = "/ingest";

let client: PostHog | null = null;
let loading: Promise<PostHog | null> | null = null;
const queue: { event: string; props?: Props }[] = [];

export function loadAnalytics(): Promise<PostHog | null> {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || typeof window === "undefined") return Promise.resolve(null);
  if (client) return Promise.resolve(client);
  if (loading) return loading;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  loading = import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: ANALYTICS_HOST,
        ui_host: "https://us.posthog.com",
        defaults: "2026-08-30",
        cookieless_mode: "always",
        person_profiles: "never",
        autocapture: false,
        capture_pageview: false, // manual, App-Router-aware (see components/Analytics.tsx)
        disable_session_recording: true,
        respect_dnt: true,
      });
      posthog.register({ app: APP, surface: "web" });
      client = posthog;
      for (const q of queue.splice(0)) posthog.capture(q.event, q.props);
      return posthog;
    })
    .catch(() => null);
  return loading;
}

/** Fire-and-forget event. Safe to call anywhere, in any environment. */
export function track(event: string, props?: Props): void {
  if (!analyticsEnabled) return;
  if (client) {
    client.capture(event, props);
    return;
  }
  queue.push({ event, props });
  void loadAnalytics();
}

export type SearchOutcome = "ok" | "invalid" | "not_found" | "rate_limited" | "error" | "network_error";

/** Collapses the scout route's status to an enum, so the event never carries an error message. */
export function searchOutcome(status: number): SearchOutcome {
  if (status >= 200 && status < 300) return "ok";
  if (status === 400) return "invalid";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  return "error";
}
