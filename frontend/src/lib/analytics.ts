import type { AnyRouter } from '@tanstack/react-router';

export function initAnalytics(router: AnyRouter) {
  router.subscribe('onResolved', ({ toLocation }) => {
    window.gtag?.('event', 'page_view', {
      page_path: toLocation.pathname,
    });
  });
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
) {
  window.gtag?.('event', name, params);
}
