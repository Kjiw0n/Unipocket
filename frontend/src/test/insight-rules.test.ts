import { describe, expect, it } from 'vitest';

import { behaviorRules } from '@/lib/insight/rules/behavior.rules';
import { categoryRules } from '@/lib/insight/rules/category.rules';
import { paceRules } from '@/lib/insight/rules/pace.rules';
import { qualityRules } from '@/lib/insight/rules/quality.rules';

import {
  buildAnalysis,
  buildInput,
  buildNormalizedExpense,
} from './insight-test-utils';

const findRule = <T extends { id: string }>(rules: T[], id: string) =>
  rules.find((rule) => rule.id === id)!;

describe('Insight Rules', () => {
  it('평균 대비 130% 미만이면 카테고리 과소비 룰이 발동하지 않는다', () => {
    const rule = findRule(categoryRules, 'category-overspend');
    const input = buildInput({
      analysis: buildAnalysis({
        items: [
          { categoryIndex: 2, mySpentAmount: '129', averageSpentAmount: '100' },
        ],
      }),
    });

    expect(rule.evaluate(input)).toBeNull();
  });

  it('평균 대비 130% 이상이고 총지출 비중이 충분하면 카테고리 과소비 룰이 발동한다', () => {
    const rule = findRule(categoryRules, 'category-overspend');
    const input = buildInput({
      analysis: buildAnalysis({
        items: [
          { categoryIndex: 2, mySpentAmount: '200', averageSpentAmount: '100' },
        ],
      }),
      thisMonthExpenses: Array.from({ length: 5 }, () =>
        buildNormalizedExpense({ amount: 200, category: 2 }),
      ),
    });

    expect(rule.evaluate(input)?.ruleId).toBe('category-overspend');
  });

  it('지난달 카테고리 거래가 3건 미만이면 급증 룰이 발동하지 않는다', () => {
    const rule = findRule(categoryRules, 'category-surge');
    const input = buildInput({
      thisMonthExpenses: Array.from({ length: 5 }, () =>
        buildNormalizedExpense({ amount: 200, category: 2 }),
      ),
      lastMonthExpenses: [
        buildNormalizedExpense({ amount: 100, category: 2 }),
        buildNormalizedExpense({ amount: 100, category: 2 }),
      ],
    });

    expect(rule.evaluate(input)).toBeNull();
  });

  it('전월 대비 20% 이상 차이나면 월간 페이스 룰이 발동한다', () => {
    const rule = findRule(paceRules, 'monthly-pace');
    const input = buildInput({
      analysis: buildAnalysis({
        diff: '250',
        prevMonthItem: Array.from({ length: 10 }, (_, index) => ({
          date: `2026-06-${String(index + 1).padStart(2, '0')}`,
          cumulatedAmount: '1000',
        })),
      }),
    });

    expect(rule.evaluate(input)?.ruleId).toBe('monthly-pace');
  });

  it('월간 페이스는 지난달 전체 합계가 아니라 같은 날짜 누적액을 분모로 쓴다', () => {
    const rule = findRule(paceRules, 'monthly-pace');
    const input = buildInput({
      analysis: buildAnalysis({
        diff: '250',
        lastMonthTotal: '10000',
        thisMonthCount: 3,
        lastMonthCount: 10,
        prevMonthItem: [
          { date: '2026-06-01', cumulatedAmount: '100' },
          { date: '2026-06-02', cumulatedAmount: '500' },
          { date: '2026-06-03', cumulatedAmount: '1000' },
        ],
      }),
    });

    expect(rule.evaluate(input)?.params.pct).toBe(25);
  });

  it('같은 날짜의 지난달 누적액이 없으면 월간 페이스 룰이 발동하지 않는다', () => {
    const rule = findRule(paceRules, 'monthly-pace');
    const input = buildInput({ analysis: buildAnalysis({ diff: '250' }) });

    expect(rule.evaluate(input)).toBeNull();
  });

  it('예산 사용 속도가 느리면 budget-burn 룰이 slow 상태로 발동한다', () => {
    const rule = findRule(paceRules, 'budget-burn');
    const input = buildInput({
      budget: { budget: 10000, spent: 400 },
      elapsedDays: 15,
      daysInMonth: 30,
    });

    const result = rule.evaluate(input);

    expect(result?.severity).toBe('positive');
    expect(result?.params.paceStatus).toBe('slow');
  });

  it('LOCAL 통화에서는 예산 원금 기준이 불명확하므로 budget-burn 룰이 발동하지 않는다', () => {
    const rule = findRule(paceRules, 'budget-burn');
    const input = buildInput({
      currencyType: 'LOCAL',
      budget: { budget: 10000, spent: 9000 },
    });

    expect(rule.evaluate(input)).toBeNull();
  });

  it('완결된 최근 3개 주 지출이 연속 증가하면 weekly-trend 룰이 발동한다', () => {
    const rule = findRule(paceRules, 'weekly-trend');
    const input = buildInput({
      isCurrentMonth: false,
      thisMonthExpenses: [
        ...Array.from({ length: 4 }, () =>
          buildNormalizedExpense({
            amount: 100,
            occurredAt: new Date(2026, 6, 15),
          }),
        ),
        ...Array.from({ length: 4 }, () =>
          buildNormalizedExpense({
            amount: 150,
            occurredAt: new Date(2026, 6, 22),
          }),
        ),
        ...Array.from({ length: 4 }, () =>
          buildNormalizedExpense({
            amount: 200,
            occurredAt: new Date(2026, 6, 29),
          }),
        ),
      ],
    });

    expect(rule.evaluate(input)?.ruleId).toBe('weekly-trend');
  });

  it('중간 주 지출이 비어 있으면 weekly-trend 룰이 발동하지 않는다', () => {
    const rule = findRule(paceRules, 'weekly-trend');
    const input = buildInput({
      isCurrentMonth: false,
      thisMonthExpenses: [
        ...Array.from({ length: 6 }, () =>
          buildNormalizedExpense({
            amount: 100,
            occurredAt: new Date(2026, 6, 1),
          }),
        ),
        ...Array.from({ length: 6 }, () =>
          buildNormalizedExpense({
            amount: 200,
            occurredAt: new Date(2026, 6, 15),
          }),
        ),
      ],
    });

    expect(rule.evaluate(input)).toBeNull();
  });

  it('첫 주 지출이 0이면 weekly-trend 룰이 발동하지 않는다', () => {
    const rule = findRule(paceRules, 'weekly-trend');
    const input = buildInput({
      isCurrentMonth: false,
      daysInMonth: 21,
      thisMonthExpenses: [
        ...Array.from({ length: 6 }, () =>
          buildNormalizedExpense({
            amount: 100,
            occurredAt: new Date(2026, 6, 8),
          }),
        ),
        ...Array.from({ length: 6 }, () =>
          buildNormalizedExpense({
            amount: 200,
            occurredAt: new Date(2026, 6, 15),
          }),
        ),
      ],
    });

    expect(rule.evaluate(input)).toBeNull();
  });

  it('현재월의 미완결 마지막 주만으로는 weekly-trend 룰이 발동하지 않는다', () => {
    const rule = findRule(paceRules, 'weekly-trend');
    const input = buildInput({
      elapsedDays: 20,
      today: new Date('2026-07-20T00:00:00'),
      thisMonthExpenses: [
        ...Array.from({ length: 4 }, () =>
          buildNormalizedExpense({
            amount: 100,
            occurredAt: new Date(2026, 6, 1),
          }),
        ),
        ...Array.from({ length: 4 }, () =>
          buildNormalizedExpense({
            amount: 150,
            occurredAt: new Date(2026, 6, 8),
          }),
        ),
        ...Array.from({ length: 4 }, () =>
          buildNormalizedExpense({
            amount: 200,
            occurredAt: new Date(2026, 6, 15),
          }),
        ),
      ],
    });

    expect(rule.evaluate(input)).toBeNull();
  });

  it('같은 거래처 반복 지출이 충분하면 repeat-merchant 룰이 발동한다', () => {
    const rule = findRule(behaviorRules, 'repeat-merchant');
    const input = buildInput({
      thisMonthExpenses: [
        ...Array.from({ length: 4 }, () =>
          buildNormalizedExpense({ merchantName: '카페', amount: 100 }),
        ),
        ...Array.from({ length: 4 }, () =>
          buildNormalizedExpense({ merchantName: '식당', amount: 50 }),
        ),
      ],
    });

    expect(rule.evaluate(input)?.ruleId).toBe('repeat-merchant');
  });

  it('같은 거래처 반복 횟수가 4회 미만이면 repeat-merchant 룰이 발동하지 않는다', () => {
    const rule = findRule(behaviorRules, 'repeat-merchant');
    const input = buildInput({
      thisMonthExpenses: Array.from({ length: 8 }, (_, index) =>
        buildNormalizedExpense({ merchantName: `거래처${index}`, amount: 100 }),
      ),
    });

    expect(rule.evaluate(input)).toBeNull();
  });

  it('현금 비중이 지난달보다 15%p 이상 변하면 cash-card-shift 룰이 발동한다', () => {
    const rule = findRule(behaviorRules, 'cash-card-shift');
    const input = buildInput({
      thisMonthExpenses: Array.from({ length: 5 }, () =>
        buildNormalizedExpense({ isCash: true }),
      ),
      lastMonthExpenses: Array.from({ length: 5 }, () =>
        buildNormalizedExpense({ isCash: false }),
      ),
    });

    expect(rule.evaluate(input)?.ruleId).toBe('cash-card-shift');
  });

  it('현금 비중 변화가 15%p 미만이면 cash-card-shift 룰이 발동하지 않는다', () => {
    const rule = findRule(behaviorRules, 'cash-card-shift');
    const input = buildInput({
      thisMonthExpenses: [
        buildNormalizedExpense({ isCash: true, amount: 10 }),
        ...Array.from({ length: 9 }, () =>
          buildNormalizedExpense({ isCash: false, amount: 90 }),
        ),
      ],
      lastMonthExpenses: Array.from({ length: 5 }, () =>
        buildNormalizedExpense({ isCash: false }),
      ),
    });

    expect(rule.evaluate(input)).toBeNull();
  });

  it('특정 요일 지출 비중이 30% 이상이면 weekday-pattern 룰이 발동한다', () => {
    const rule = findRule(behaviorRules, 'weekday-pattern');
    const input = buildInput({
      thisMonthExpenses: [
        ...Array.from({ length: 5 }, (_, index) =>
          buildNormalizedExpense({
            amount: 200,
            occurredAt: new Date(2026, 6, 6 + index * 7),
          }),
        ),
        ...Array.from({ length: 10 }, (_, index) =>
          buildNormalizedExpense({
            amount: 20,
            occurredAt: new Date(2026, 6, index + 1),
          }),
        ),
      ],
    });

    expect(rule.evaluate(input)?.ruleId).toBe('weekday-pattern');
  });

  it('특정 요일 거래가 3건 미만이면 weekday-pattern 룰이 발동하지 않는다', () => {
    const rule = findRule(behaviorRules, 'weekday-pattern');
    const input = buildInput({
      thisMonthExpenses: Array.from({ length: 15 }, (_, index) =>
        buildNormalizedExpense({
          amount: 100,
          occurredAt: new Date(2026, 6, index + 1),
        }),
      ),
    });

    expect(rule.evaluate(input)).toBeNull();
  });

  it('미분류 비중이 20% 이상이면 미분류 넛지가 발동한다', () => {
    const rule = findRule(qualityRules, 'uncategorized-nudge');
    const input = buildInput({
      thisMonthExpenses: [
        buildNormalizedExpense({ category: 0 }),
        buildNormalizedExpense({ category: 2 }),
        buildNormalizedExpense({ category: 2 }),
        buildNormalizedExpense({ category: 2 }),
        buildNormalizedExpense({ category: 2 }),
      ],
    });

    expect(rule.evaluate(input)?.ruleId).toBe('uncategorized-nudge');
  });

  it('큰 단일 지출이 IQR 상한과 전체 비중 기준을 넘으면 anomaly-expense 룰이 발동한다', () => {
    const rule = findRule(qualityRules, 'anomaly-expense');
    const input = buildInput({
      thisMonthExpenses: [
        ...Array.from({ length: 19 }, (_, index) =>
          buildNormalizedExpense({
            amount: 100 + index,
            occurredAt: new Date(2026, 6, index + 1),
          }),
        ),
        buildNormalizedExpense({
          amount: 5000,
          merchantName: '항공권',
          occurredAt: new Date(2026, 6, 20),
        }),
      ],
    });

    expect(rule.evaluate(input)?.ruleId).toBe('anomaly-expense');
  });

  it('큰 단일 지출이 전체 지출의 15% 미만이면 anomaly-expense 룰이 발동하지 않는다', () => {
    const rule = findRule(qualityRules, 'anomaly-expense');
    const input = buildInput({
      thisMonthExpenses: [
        ...Array.from({ length: 19 }, (_, index) =>
          buildNormalizedExpense({
            amount: 2000,
            occurredAt: new Date(2026, 6, index + 1),
          }),
        ),
        buildNormalizedExpense({
          amount: 5000,
          merchantName: '항공권',
          occurredAt: new Date(2026, 6, 20),
        }),
      ],
    });

    expect(rule.evaluate(input)).toBeNull();
  });

  it('3일 이상 무지출 구간이 있으면 no-spend-streak 룰이 발동한다', () => {
    const rule = findRule(qualityRules, 'no-spend-streak');
    const input = buildInput({
      elapsedDays: 5,
      thisMonthExpenses: [
        buildNormalizedExpense({ occurredAt: new Date(2026, 6, 1) }),
      ],
    });

    expect(rule.evaluate(input)?.ruleId).toBe('no-spend-streak');
  });

  it('무지출 구간이 3일 미만이면 no-spend-streak 룰이 발동하지 않는다', () => {
    const rule = findRule(qualityRules, 'no-spend-streak');
    const input = buildInput({
      elapsedDays: 5,
      thisMonthExpenses: [
        buildNormalizedExpense({ occurredAt: new Date(2026, 6, 1) }),
        buildNormalizedExpense({ occurredAt: new Date(2026, 6, 3) }),
        buildNormalizedExpense({ occurredAt: new Date(2026, 6, 5) }),
      ],
    });

    expect(rule.evaluate(input)).toBeNull();
  });

  it('소액 결제가 15건 이상이고 합계 비중이 충분하면 small-frequent 룰이 발동한다', () => {
    const rule = findRule(qualityRules, 'small-frequent');
    const input = buildInput({
      thisMonthExpenses: [
        ...Array.from({ length: 20 }, () =>
          buildNormalizedExpense({ amount: 10 }),
        ),
        buildNormalizedExpense({ amount: 900 }),
      ],
    });

    expect(rule.evaluate(input)?.ruleId).toBe('small-frequent');
  });

  it('소액 결제 합계가 전체의 15% 미만이면 small-frequent 룰이 발동하지 않는다', () => {
    const rule = findRule(qualityRules, 'small-frequent');
    const input = buildInput({
      thisMonthExpenses: [
        ...Array.from({ length: 15 }, () =>
          buildNormalizedExpense({ amount: 1 }),
        ),
        buildNormalizedExpense({ amount: 1000 }),
      ],
    });

    expect(rule.evaluate(input)).toBeNull();
  });

  it('평균 대비 70% 이하이고 평균 비중이 충분하면 category-saving 룰이 발동한다', () => {
    const rule = findRule(categoryRules, 'category-saving');
    const input = buildInput({
      analysis: buildAnalysis({
        items: [
          { categoryIndex: 2, mySpentAmount: '60', averageSpentAmount: '100' },
          { categoryIndex: 3, mySpentAmount: '100', averageSpentAmount: '100' },
        ],
      }),
    });

    expect(rule.evaluate(input)?.ruleId).toBe('category-saving');
  });

  it('평균 대비 70%를 넘으면 category-saving 룰이 발동하지 않는다', () => {
    const rule = findRule(categoryRules, 'category-saving');
    const input = buildInput({
      analysis: buildAnalysis({
        items: [
          { categoryIndex: 2, mySpentAmount: '71', averageSpentAmount: '100' },
        ],
      }),
    });

    expect(rule.evaluate(input)).toBeNull();
  });
});
