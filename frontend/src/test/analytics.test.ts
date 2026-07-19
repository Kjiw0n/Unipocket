import { describe, expect, it } from 'vitest';

import { isAnalyticsExcludedPath } from '@/lib/analytics';

describe('Analytics route policy', () => {
  it('공유 경로에서는 외부 분석 도구를 제외한다', () => {
    expect(isAnalyticsExcludedPath('/share')).toBe(true);
    expect(isAnalyticsExcludedPath('/share/preview')).toBe(true);
    expect(isAnalyticsExcludedPath('/report')).toBe(false);
  });
});
