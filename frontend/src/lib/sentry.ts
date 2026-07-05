import * as Sentry from '@sentry/react';

export function initSentry() {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.PROD ? 1.0 : 0,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });

  // 로드 완료 전에 발생한 에러에는 리플레이 없음 (에러 캡처 자체는 init부터 동작)
  Sentry.lazyLoadIntegration('replayIntegration')
    .then((replayIntegration) => {
      Sentry.addIntegration(replayIntegration());
    })
    .catch(() => {
      // 리플레이 로드 실패는 에러 수집 자체에 영향 없음
    });
}
