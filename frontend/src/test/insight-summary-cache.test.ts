import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GetInsightSummaryRequest } from '@/api/insights/type';
import {
  getCurrentInsightSummary,
  getPastInsightSummary,
} from '@/app/api/insights/summary/cache';

const cacheMock = vi.hoisted(() => vi.fn());

vi.mock('next/cache', () => ({ unstable_cache: cacheMock }));
vi.mock('@/app/api/insights/summary/gemini', () => ({
  generateInsightSummary: vi.fn().mockResolvedValue('요약입니다.'),
}));

const request: GetInsightSummaryRequest = {
  accountBookId: 5,
  year: 2026,
  month: 7,
  currencyType: 'BASE',
  facts: [
    {
      ruleId: 'weekly-trend',
      severity: 'warning',
      params: { pct: 41 },
    },
  ],
};

describe('Insight Summary Cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheMock.mockImplementation((callback) => callback);
  });

  it('과거 달은 계정부·연월·통화 키로 영구 캐시한다', async () => {
    await getPastInsightSummary(request, 'request-id');

    expect(cacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      ['insight-summary', '5', '2026-07', 'BASE', 'past'],
      { revalidate: false },
    );
  });

  it('당월은 계정부·연월·통화 키로 24시간 캐시한다', async () => {
    await getCurrentInsightSummary(request, 'request-id');

    expect(cacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      ['insight-summary', '5', '2026-07', 'BASE', 'current'],
      { revalidate: 86_400 },
    );
  });
});
