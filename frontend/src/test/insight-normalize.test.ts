import { describe, expect, it } from 'vitest';

import {
  buildExpenseFilter,
  normalizeBudget,
  normalizeExpenses,
} from '@/lib/insight/normalize';

import { buildExpense } from './insight-test-utils';

describe('Insight Normalize', () => {
  it('선택한 통화 기준으로 지출 금액을 정규화한다', () => {
    const expenses = [
      buildExpense({ localCurrencyAmount: 1200, baseCurrencyAmount: 800 }),
    ];

    expect(normalizeExpenses(expenses, 'LOCAL')[0].amount).toBe(1200);
    expect(normalizeExpenses(expenses, 'BASE')[0].amount).toBe(800);
  });

  it('수입 카테고리는 인사이트 계산에서 제외한다', () => {
    const result = normalizeExpenses(
      [buildExpense({ category: 9 }), buildExpense({ category: 2 })],
      'BASE',
    );

    expect(result).toHaveLength(1);
    expect(result[0].category).toBe(2);
  });

  it('예산 위젯 spent 금액은 선택 통화에 맞춰 고른다', () => {
    const budget = {
      budget: '10000',
      baseCountryCode: 'KR',
      localCountryCode: 'JP',
      baseSpentAmount: '3000',
      localSpentAmount: '500',
    } as const;

    expect(normalizeBudget(budget, 'BASE')).toEqual({
      budget: 10000,
      spent: 3000,
    });
    expect(normalizeBudget(budget, 'LOCAL')).toEqual({
      budget: 10000,
      spent: 500,
    });
  });

  it('지출 목록 월 필터는 OffsetDateTime 변환 가능한 ISO 문자열로 만든다', () => {
    const filter = buildExpenseFilter(2026, 7);

    expect(filter.startDate).toContain('T');
    expect(filter.endDate).toContain('T');
    expect(() => new Date(filter.startDate)).not.toThrow();
    expect(() => new Date(filter.endDate)).not.toThrow();
  });
});
