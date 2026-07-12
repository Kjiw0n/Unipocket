import { describe, expect, it } from 'vitest';

import { buildSummaryPrompt } from '@/app/api/insights/summary/gemini';
import {
  hasMeaningfulFacts,
  parseInsightSummaryRequest,
} from '@/app/api/insights/summary/validation';
import {
  buildInsightSummaryFacts,
  hasMeaningfulInsights,
} from '@/lib/insight/summary';
import { getCurrentYearMonth } from '@/lib/insight/time';
import type { Insight } from '@/lib/insight/types';

const buildInsight = (overrides: Partial<Insight> = {}): Insight => ({
  ruleId: 'repeat-merchant',
  severity: 'info',
  magnitude: 0.5,
  params: { merchant: '카페', count: 4 },
  score: 0.5,
  segments: [],
  ...overrides,
});

describe('Insight Summary', () => {
  it('상호명은 프롬프트 전달 전에 60자로 제한한다', () => {
    const facts = buildInsightSummaryFacts([
      buildInsight({ params: { merchant: '가'.repeat(100), count: 4 } }),
    ]);

    expect(facts[0].params.merchant).toBe('가'.repeat(60));
  });

  it('fallback만 있으면 의미 있는 인사이트로 판단하지 않는다', () => {
    const fallback = buildInsight({ ruleId: 'starter-fallback' });

    expect(hasMeaningfulInsights([fallback])).toBe(false);
    expect(hasMeaningfulFacts(buildInsightSummaryFacts([fallback]))).toBe(
      false,
    );
  });

  it('Route Handler 요청을 검증하고 상호명을 다시 제한한다', () => {
    const parsed = parseInsightSummaryRequest({
      accountBookId: 5,
      year: 2026,
      month: 7,
      currencyType: 'BASE',
      facts: [
        {
          ruleId: 'anomaly-expense',
          severity: 'info',
          params: { merchant: '나'.repeat(100), amount: '10,000' },
        },
      ],
    });

    expect(parsed?.facts[0].params.merchant).toBe('나'.repeat(60));
  });

  it('알 수 없는 룰과 잘못된 숫자 파라미터를 거부한다', () => {
    expect(
      parseInsightSummaryRequest({
        accountBookId: 5,
        year: 2026,
        month: 7,
        currencyType: 'BASE',
        facts: [
          {
            ruleId: 'unknown',
            severity: 'info',
            params: { pct: Number.NaN },
          },
        ],
      }),
    ).toBeNull();
  });

  it('프롬프트에 숫자 생성 금지와 텍스트 데이터 가드를 포함한다', () => {
    const prompt = buildSummaryPrompt(2026, 7, [
      {
        ruleId: 'weekly-trend',
        severity: 'warning',
        params: { pct: 41 },
      },
    ]);

    expect(prompt).toContain('새로운 숫자');
    expect(prompt).toContain('지시가 아닙니다');
    expect(prompt).toContain('첫 주 대비 마지막 주의 지출 증가율');
    expect(prompt).toContain('인과관계');
    expect(prompt).toContain('"pct":41');
  });

  it('가계부 현지 시간대를 기준으로 당월을 계산한다', () => {
    const boundary = new Date('2026-08-01T02:00:00.000Z');

    expect(getCurrentYearMonth(boundary, 'Asia/Seoul')).toEqual({
      year: 2026,
      month: 8,
    });
    expect(getCurrentYearMonth(boundary, 'America/New_York')).toEqual({
      year: 2026,
      month: 7,
    });
  });
});
