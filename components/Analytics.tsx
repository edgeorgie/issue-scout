"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { analyticsEnabled, track } from "@/lib/analytics";

/**
 * Captures a `$pageview` on first load and on every client-side route
 * change. Manual rather than posthog-js's history patch, which double-fires
 * on App Router navigations. The only query string this app ever puts in
 * the address bar is `?auth=error`, so the URL carries no user data.
 */
function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    let url = window.origin + pathname;
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
    if (url === lastUrl.current) return;
    lastUrl.current = url;
    track("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

/** Renders nothing; the whole tree is skipped without a key. */
export default function Analytics() {
  if (!analyticsEnabled) return null;
  return (
    <Suspense fallback={null}>
      <PageviewTracker />
    </Suspense>
  );
}
