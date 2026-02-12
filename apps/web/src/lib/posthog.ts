import posthog from "posthog-js";

export function initPostHog() {
  if (typeof window === "undefined") return;

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (!apiKey) {
    console.warn("PostHog not initialized: Missing NEXT_PUBLIC_POSTHOG_KEY");
    return;
  }

  posthog.init(apiKey, {
    api_host: apiHost || "https://app.posthog.com",
    capture_pageview: false, // We'll handle this manually
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") {
        posthog.opt_out_capturing();
      }
    },
  });
}

export function trackPageView(url?: string) {
  if (typeof window === "undefined") return;
  posthog.capture("$pageview", url ? { $current_url: url } : undefined);
}

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.capture(name, properties);
}

export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.identify(userId, properties);
}

export function resetUser() {
  if (typeof window === "undefined") return;
  posthog.reset();
}

export { posthog };
