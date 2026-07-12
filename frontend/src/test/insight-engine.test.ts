import { describe, expect, it } from 'vitest';

import { runInsightEngine } from '@/lib/insight/engine';

import {
  buildAnalysis,
  buildInput,
  buildNormalizedExpense,
} from './insight-test-utils';

describe('Insight Engine', () => {
  it('거래가 5건 미만이면 starter fallback만 반환한다', () => {
    const { top: insights } = runInsightEngine(
      buildInput({ thisMonthExpenses: [buildNormalizedExpense()] }),
    );

    expect(insights).toHaveLength(1);
    expect(insights[0].ruleId).toBe('starter-fallback');
  });

  it('거래가 5건 이상인데 발동한 룰이 없으면 starter fallback을 반환하지 않는다', () => {
    const { top: insights } = runInsightEngine(
      buildInput({
        isCurrentMonth: false,
        thisMonthExpenses: Array.from({ length: 5 }, (_, index) =>
          buildNormalizedExpense({
            amount: 100,
            category: 2,
            occurredAt: new Date(2026, 6, index + 1),
            merchantName: `식당${index}`,
          }),
        ),
      }),
    );

    expect(insights).toHaveLength(1);
    expect(insights[0].ruleId).toBe('no-insight-fallback');
    expect(insights[0].segments.map((segment) => segment.text).join('')).toBe(
      '이번 달 소비 흐름이 안정적이에요',
    );
  });

  it('카테고리가 같은 인사이트는 높은 점수 1개만 남긴다', () => {
    const { top: insights } = runInsightEngine(
      buildInput({
        analysis: buildAnalysis({
          items: [
            {
              categoryIndex: 2,
              mySpentAmount: '5000',
              averageSpentAmount: '1000',
            },
            {
              categoryIndex: 5,
              mySpentAmount: '100',
              averageSpentAmount: '1000',
            },
          ],
        }),
        thisMonthExpenses: Array.from({ length: 20 }, (_, index) =>
          buildNormalizedExpense({
            amount: index === 0 ? 5000 : 100,
            category: 2,
            occurredAt: new Date(2026, 6, index + 1),
          }),
        ),
      }),
    );

    expect(insights.filter((insight) => insight.categoryId === 2)).toHaveLength(
      1,
    );
  });

  it('상위 3개가 전부 경고면 positive 인사이트를 3번째로 섞는다', () => {
    const { top: insights, fired } = runInsightEngine(
      buildInput({
        analysis: buildAnalysis({
          items: [
            {
              categoryIndex: 2,
              mySpentAmount: '5000',
              averageSpentAmount: '1000',
            },
            {
              categoryIndex: 5,
              mySpentAmount: '100',
              averageSpentAmount: '1000',
            },
          ],
          diff: '300',
          prevMonthItem: Array.from({ length: 10 }, (_, index) => ({
            date: `2026-06-${String(index + 1).padStart(2, '0')}`,
            cumulatedAmount: '1000',
          })),
        }),
        budget: { budget: 10000, spent: 9000 },
        thisMonthExpenses: Array.from({ length: 20 }, (_, index) =>
          buildNormalizedExpense({
            amount: 250 + index * 10,
            category: index % 2 === 0 ? 2 : 5,
            occurredAt: new Date(2026, 6, index + 1),
          }),
        ),
      }),
    );

    expect(insights).toHaveLength(3);
    expect(insights.some((insight) => insight.severity === 'positive')).toBe(
      true,
    );
    expect(fired.length).toBeGreaterThanOrEqual(insights.length);
  });

  it('미분류 비중이 30% 이상이면 카테고리 의존 룰 점수가 낮아진다', () => {
    const clean = runInsightEngine(
      buildInput({
        analysis: buildAnalysis({
          items: [
            {
              categoryIndex: 2,
              mySpentAmount: '5000',
              averageSpentAmount: '1000',
            },
          ],
        }),
        thisMonthExpenses: Array.from({ length: 10 }, () =>
          buildNormalizedExpense({ amount: 500, category: 2 }),
        ),
      }),
    ).fired.find((insight) => insight.ruleId === 'category-overspend');

    const noisy = runInsightEngine(
      buildInput({
        analysis: buildAnalysis({
          items: [
            {
              categoryIndex: 2,
              mySpentAmount: '5000',
              averageSpentAmount: '1000',
            },
          ],
        }),
        thisMonthExpenses: [
          ...Array.from({ length: 7 }, () =>
            buildNormalizedExpense({ amount: 500, category: 2 }),
          ),
          ...Array.from({ length: 3 }, () =>
            buildNormalizedExpense({ amount: 100, category: 0 }),
          ),
        ],
      }),
    ).fired.find((insight) => insight.ruleId === 'category-overspend');

    expect(clean?.score).toBeGreaterThan(noisy?.score ?? 0);
  });

  it('raw 지출 의존 룰에는 일부 데이터 기준 설명을 붙인다', () => {
    const { fired: insights } = runInsightEngine(
      buildInput({
        isPartialExpenseData: true,
        thisMonthExpenses: [
          ...Array.from({ length: 4 }, () =>
            buildNormalizedExpense({ merchantName: '카페', amount: 100 }),
          ),
          ...Array.from({ length: 4 }, () =>
            buildNormalizedExpense({ merchantName: '식당', amount: 50 }),
          ),
        ],
      }),
    );

    expect(
      insights.find((insight) => insight.ruleId === 'repeat-merchant')
        ?.description,
    ).toContain('일부 데이터 기준');
  });

  it('analysis 기반 카테고리 과소비에는 일부 데이터 기준 설명을 붙이지 않는다', () => {
    const { fired: insights } = runInsightEngine(
      buildInput({
        isPartialExpenseData: true,
        analysis: buildAnalysis({
          items: [
            {
              categoryIndex: 2,
              mySpentAmount: '5000',
              averageSpentAmount: '1000',
            },
          ],
        }),
        thisMonthExpenses: Array.from({ length: 10 }, () =>
          buildNormalizedExpense({ amount: 500, category: 2 }),
        ),
      }),
    );

    expect(
      insights.find((insight) => insight.ruleId === 'category-overspend')
        ?.description,
    ).not.toContain('일부 데이터 기준');
  });
});
