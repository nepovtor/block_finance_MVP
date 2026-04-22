export type AnalyticsEventName =
  | "app_open"
  | "payment_made"
  | "reward_received"
  | "game_started"
  | "game_finished"
  | "referral_clicked";

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  timestamp: string;
  properties?: Record<string, unknown>;
};

const ANALYTICS_STORAGE_KEY = "block-finance-analytics-events";

function readStoredEvents(): AnalyticsEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(ANALYTICS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
  } catch {
    return [];
  }
}

function writeStoredEvents(events: AnalyticsEvent[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events));
}

export function trackEvent(
  name: AnalyticsEventName,
  properties?: Record<string, unknown>
) {
  const event: AnalyticsEvent = {
    name,
    timestamp: new Date().toISOString(),
    properties,
  };

  const events = [...readStoredEvents(), event].slice(-100);
  writeStoredEvents(events);
  console.log("[analytics]", event);
}

export function trackAppOpenOncePerSession() {
  if (typeof window === "undefined") {
    return;
  }

  const sessionKey = "block-finance-app-open-tracked";

  if (window.sessionStorage.getItem(sessionKey)) {
    return;
  }

  window.sessionStorage.setItem(sessionKey, "true");
  trackEvent("app_open", { path: window.location.pathname });
}

export function getRecentAnalyticsEvents() {
  return readStoredEvents().slice(-6).reverse();
}
