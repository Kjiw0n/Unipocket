import type { CategoryId } from '@/types/category';
import { CATEGORIES } from '@/types/category';

import { clamp01, sum, sumByCategory, toNumber } from '../stats';
import type { InsightRule } from '../types';

const OVERSEND_RATIO_THRESHOLD = 1.3;
const CATEGORY_MIN_TOTAL_SHARE = 0.1;
const SURGE_RATIO_THRESHOLD = 0.5;
const SURGE_MIN_TOTAL_SHARE = 0.08;
const SAVING_RATIO_THRESHOLD = 0.7;

export const categoryRules: InsightRule[] = [
  {
    id: 'category-overspend',
    minDataRequirement: { minTxCount: 3 },
    evaluate: (input) => {
      const total = sum(
        input.thisMonthExpenses.map((expense) => expense.amount),
      );
      if (total <= 0) return null;

      const candidate = input.analysis.compareByCategory.items
        .filter((item) => item.categoryIndex !== 0 && item.categoryIndex !== 9)
        .map((item) => {
          const my = toNumber(item.mySpentAmount);
          const avg = toNumber(item.averageSpentAmount);
          return { item, my, avg, ratio: avg > 0 ? my / avg : 0 };
        })
        .filter(
          ({ my, ratio }) =>
            ratio >= OVERSEND_RATIO_THRESHOLD &&
            my / total >= CATEGORY_MIN_TOTAL_SHARE,
        )
        .sort((a, b) => b.ratio - a.ratio)[0];

      if (!candidate) return null;

      return {
        ruleId: 'category-overspend',
        severity: candidate.ratio >= 2 ? 'alert' : 'warning',
        magnitude: clamp01((candidate.ratio - 1) / 1.5),
        categoryId: candidate.item.categoryIndex,
        params: {
          category: CATEGORIES[candidate.item.categoryIndex].name,
          pct: Math.round((candidate.ratio - 1) * 100),
        },
      };
    },
  },
  {
    id: 'category-surge',
    minDataRequirement: { minTxCount: 5, needsLastMonth: true },
    evaluate: (input) => {
      const total = sum(
        input.thisMonthExpenses.map((expense) => expense.amount),
      );
      const thisTotals = sumByCategory(input.thisMonthExpenses);
      const lastTotals = sumByCategory(input.lastMonthExpenses);
      const lastCounts = new Map<CategoryId, number>();
      input.lastMonthExpenses.forEach((expense) => {
        lastCounts.set(
          expense.category,
          (lastCounts.get(expense.category) ?? 0) + 1,
        );
      });

      const candidate = [...thisTotals.entries()]
        .filter(([category]) => category !== 0 && category !== 9)
        .map(([category, thisAmount]) => {
          const lastAmount = lastTotals.get(category) ?? 0;
          return {
            category,
            thisAmount,
            lastAmount,
            increase:
              lastAmount > 0 ? (thisAmount - lastAmount) / lastAmount : 0,
          };
        })
        .filter(
          ({ category, thisAmount, increase }) =>
            increase >= SURGE_RATIO_THRESHOLD &&
            thisAmount / total >= SURGE_MIN_TOTAL_SHARE &&
            (lastCounts.get(category) ?? 0) >= 3,
        )
        .sort((a, b) => b.increase - a.increase)[0];

      if (!candidate) return null;

      return {
        ruleId: 'category-surge',
        severity: 'warning',
        magnitude: clamp01(candidate.increase),
        categoryId: candidate.category,
        params: {
          category: CATEGORIES[candidate.category].name,
          pct: Math.round(candidate.increase * 100),
          amount: input.formatAmount(
            candidate.thisAmount - candidate.lastAmount,
          ),
          unit: input.unit,
        },
      };
    },
  },
  {
    id: 'category-saving',
    minDataRequirement: { minTxCount: 3 },
    evaluate: (input) => {
      const averageTotal = sum(
        input.analysis.compareByCategory.items
          .filter((item) => item.categoryIndex !== 9)
          .map((item) => toNumber(item.averageSpentAmount)),
      );

      const candidate = input.analysis.compareByCategory.items
        .filter((item) => item.categoryIndex !== 0 && item.categoryIndex !== 9)
        .map((item) => {
          const my = toNumber(item.mySpentAmount);
          const avg = toNumber(item.averageSpentAmount);
          return { item, my, avg, ratio: avg > 0 ? my / avg : 1 };
        })
        .filter(
          ({ my, avg, ratio }) =>
            my > 0 &&
            ratio <= SAVING_RATIO_THRESHOLD &&
            averageTotal > 0 &&
            avg / averageTotal >= CATEGORY_MIN_TOTAL_SHARE,
        )
        .sort((a, b) => a.ratio - b.ratio)[0];

      if (!candidate) return null;

      return {
        ruleId: 'category-saving',
        severity: 'positive',
        magnitude: clamp01(1 - candidate.ratio),
        categoryId: candidate.item.categoryIndex,
        params: {
          category: CATEGORIES[candidate.item.categoryIndex].name,
          pct: Math.round((1 - candidate.ratio) * 100),
        },
      };
    },
  },
];
