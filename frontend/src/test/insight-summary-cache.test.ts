import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GetInsightSummaryRequest } from '@/api/insights/type';
import {
  getCurrentInsightSummary,
  getPastInsightSummary,
  hashFacts,
} from '@/app/api/insights/summary/cache';

const cacheMock = vi.hoisted(() => vi.fn());
const generateMock = vi.hoisted(() => vi.fn().mockResolvedValue('요약입니다.'));

vi.mock('next/cache', () => ({ unstable_cache: cacheMock }));
vi.mock('@/app/api/insights/summary/gemini', () => ({
  generateInsightSummary: generateMock,
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
    generateMock.mockResolvedValue('요약입니다.');
    cacheMock.mockImplementation((callback) => callback);
  });

  it('과거 달은 계정부·연월·통화·팩트해시 키로 영구 캐시한다', async () => {
    await getPastInsightSummary(request, 'request-id');

    expect(cacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      [
        'insight-summary',
        '5',
        '2026-07',
        'BASE',
        hashFacts(request.facts),
        'past',
      ],
      { revalidate: false },
    );
  });

  it('당월은 계정부·연월·통화·팩트해시 키로 24시간 캐시한다', async () => {
    await getCurrentInsightSummary(request, 'request-id');

    expect(cacheMock).toHaveBeenCalledWith(
      expect.any(Function),
      [
        'insight-summary',
        '5',
        '2026-07',
        'BASE',
        hashFacts(request.facts),
        'current',
      ],
      { revalidate: 86_400 },
    );
  });

  it('동일 키 동시 요청은 Gemini를 한 번만 호출한다', async () => {
    let resolveSummary: (value: string) => void = () => {};
    generateMock.mockImplementationOnce(
      () =>
        new Promise<string>((resolve) => {
          resolveSummary = resolve;
        }),
    );

    const first = getPastInsightSummary(request, 'request-id-1');
    const second = getPastInsightSummary(request, 'request-id-2');

    resolveSummary('요약입니다.');
    await Promise.all([first, second]);

    expect(generateMock).toHaveBeenCalledTimes(1);
  });
});
