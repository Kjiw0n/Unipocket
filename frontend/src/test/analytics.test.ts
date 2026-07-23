import { afterEach, describe, expect, it, vi } from 'vitest';

import { isAnalyticsExcludedPath, trackPageView } from '@/lib/analytics';

describe('Analytics route policy', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('공유 경로에서는 외부 분석 도구를 제외한다', () => {
    expect(isAnalyticsExcludedPath('/share')).toBe(true);
    expect(isAnalyticsExcludedPath('/share/preview')).toBe(true);
    expect(isAnalyticsExcludedPath('/report')).toBe(false);
  });

  it('page view에는 query 없이 pathname만 포함한다', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag });

    trackPageView('/report');

    expect(gtag).toHaveBeenCalledOnce();
    expect(gtag).toHaveBeenCalledWith('event', 'page_view', {
      page_path: '/report',
    });
  });

  it('gtag이 준비되지 않아도 page view 호출은 예외를 던지지 않는다', () => {
    vi.stubGlobal('window', {});

    expect(() => trackPageView('/report')).not.toThrow();
  });
});
