import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});

Sentry.lazyLoadIntegration('replayIntegration')
  .then((integration) => Sentry.addIntegration(integration()))
  .catch(() => {});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
