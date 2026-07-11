import * as Sentry from '@sentry/react';

import { APP_ENV, IS_PROD, SENTRY_DSN } from '@/constants/env';

export function initSentry() {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: IS_PROD ? 1.0 : 0,
    replaysOnErrorSampleRate: 1.0,
    environment: APP_ENV,
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
