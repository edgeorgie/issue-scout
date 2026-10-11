import type { NextConfig } from "next";

// Gates the /ingest proxy below. Analytics is opt-in by configuration, so the
// proxy must not exist as a route when it is off.
const posthogEnabled = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  env: {
    // Defined as "" when unset so the bundler sees a literal, proves the SDK
    // import in lib/analytics.ts unreachable and leaves posthog-js out of a
    // build made without a key; an undefined variable gets no replacement.
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
  },
  // PostHog endpoints end in "/" (e.g. /e/); Next's trailing-slash redirect would drop events.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    // Same-origin proxy for analytics: the browser only ever talks to this
    // origin, and tracking blockers that filter by domain do not drop events.
    //
    // Gated on the key, not merely dormant without one. A rewrite is a
    // server-side route that exists whether or not any client calls it, so an
    // unconditional one would forward ANY body posted to /ingest/* to PostHog's
    // public ingestion API: an open relay on this domain, costing bandwidth
    // and attributing the traffic to this origin. Without a key the route does
    // not exist and /ingest/* is a plain 404.
    if (!posthogEnabled) return [];
    // Order matters: static and array before the catch-all.
    return [
      { source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/ingest/array/:path*", destination: "https://us-assets.i.posthog.com/array/:path*" },
      { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
