import { CONTENTSQUARE_KEY } from '@/constants/env';

export function initHotjar() {
  const key = CONTENTSQUARE_KEY;
  if (!key) return;

  const load = () => {
    const script = document.createElement('script');
    script.src = `https://t.contentsquare.net/uxa/${key}.js`;
    script.defer = true;
    document.head.appendChild(script);
  };

  const schedule = () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(load, { timeout: 5000 });
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
