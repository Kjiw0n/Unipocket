import { CONTENTSQUARE_KEY } from '@/config/env';
import { isAnalyticsExcludedPath } from '@/lib/analytics';

const CONTENTSQUARE_SCRIPT_ID = 'contentsquare-uxa-script';

// 예약 시점부터 load 콜백 종료까지 유지해 중복 로드 예약을 막는다.
let isLoadScheduled = false;

export function initHotjar() {
  const key = CONTENTSQUARE_KEY;
  if (!key) return;
  if (isLoadScheduled || document.getElementById(CONTENTSQUARE_SCRIPT_ID)) {
    return;
  }

  isLoadScheduled = true;

  const load = () => {
    if (isAnalyticsExcludedPath(window.location.pathname)) {
      isLoadScheduled = false;
      return;
    }

    if (document.getElementById(CONTENTSQUARE_SCRIPT_ID)) {
      isLoadScheduled = false;
      return;
    }

    const script = document.createElement('script');
    script.id = CONTENTSQUARE_SCRIPT_ID;
    script.src = `https://t.contentsquare.net/uxa/${key}.js`;
    script.defer = true;
    document.head.appendChild(script);
    isLoadScheduled = false;
  };

  const schedule = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(load, { timeout: 5000 });
    } else {
      setTimeout(load, 3000);
    }
  };

  if (document.readyState === 'complete') {
    schedule();
  } else {
    window.addEventListener('load', schedule, { once: true });
  }
}
