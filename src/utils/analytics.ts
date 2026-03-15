/**
 * Analytics stub — logs events locally for now.
 * Replace with Sentry, Firebase Analytics, or similar when ready.
 */

type EventName =
  | 'level_start'
  | 'level_complete'
  | 'level_fail'
  | 'tool_used'
  | 'upgrade_purchased'
  | 'onboarding_complete'
  | 'onboarding_skip'
  | 'settings_open'
  | 'review_prompted'
  | 'app_open';

type EventParams = Record<string, string | number | boolean>;

export const Analytics = {
  track(event: EventName, params?: EventParams) {
    if (__DEV__) {
      console.log(`[Analytics] ${event}`, params ?? '');
    }
    // TODO: Send to analytics service (Sentry, Firebase, etc.)
  },

  setUserProperty(_key: string, _value: string) {
    // TODO: Set user property in analytics service
  },
};
