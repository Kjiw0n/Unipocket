export const isAnalyticsExcludedPath = (pathname: string): boolean =>
  pathname === '/share' || pathname.startsWith('/share/');

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
) {
  window.gtag?.('event', name, params);
}
