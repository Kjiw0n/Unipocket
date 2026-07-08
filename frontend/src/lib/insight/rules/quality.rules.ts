import {
  clamp01,
  formatDateParam,
  getLongestNoSpendStreak,
  quantile,
  sum,
} from '../stats';
import type { InsightRule } from '../types';

export const qualityRules: InsightRule[] = [
  {
    id: 'anomaly-expense',
    minDataRequirement: { minTxCount: 20 },
    evaluate: (input) => {
      const amounts = input.thisMonthExpenses.map((expense) => expense.amount);
      const total = sum(amounts);
      const q1 = quantile(amounts, 0.25);
      const q3 = quantile(amounts, 0.75);
      const upper = q3 + 1.5 * (q3 - q1);
      const candidate = input.thisMonthExpenses
        .filter(
          (expense) => expense.amount > upper && expense.amount / total >= 0.15,
        )
        .sort((a, b) => b.amount - a.amount)[0];

      if (!candidate) return null;

      return {
        ruleId: 'anomaly-expense',
        severity: 'info',
        magnitude: clamp01(candidate.amount / Math.max(upper, 1) - 1),
        categoryId: candidate.category,
        params: {
          date: formatDateParam(candidate.occurredAt),
          merchant: candidate.merchantName,
          amount: input.formatAmount(candidate.amount),
          unit: input.unit,
        },
      };
    },
  },
  {
    id: 'no-spend-streak',
    minDataRequirement: { minTxCount: 1, currentMonthOnly: true },
    evaluate: (input) => {
      const days = getLongestNoSpendStreak(
        input.thisMonthExpenses,
        input.elapsedDays,
      );
      if (days < 3) return null;

      return {
        ruleId: 'no-spend-streak',
        severity: 'positive',
        magnitude: clamp01(days / 7),
        params: { days },
      };
    },
  },
  {
    id: 'uncategorized-nudge',
    minDataRequirement: { minTxCount: 1 },
    evaluate: (input) => {
      const count = input.thisMonthExpenses.filter(
        (expense) => expense.category === 0,
      ).length;
      const ratio =
        input.thisMonthExpenses.length > 0
          ? count / input.thisMonthExpenses.length
          : 0;
      if (count < 5 && ratio < 0.2) return null;

      return {
        ruleId: 'uncategorized-nudge',
        severity: 'info',
        magnitude: clamp01(ratio),
        categoryId: 0,
        params: { count, pct: Math.round(ratio * 100) },
      };
    },
  },
  {
    id: 'small-frequent',
    minDataRequirement: { minTxCount: 15 },
    evaluate: (input) => {
      const total = sum(
        input.thisMonthExpenses.map((expense) => expense.amount),
      );
      const smallExpenses = input.thisMonthExpenses.filter(
        (expense) => expense.amount < total * 0.01,
      );
      const smallTotal = sum(smallExpenses.map((expense) => expense.amount));
      if (smallExpenses.length < 15 || smallTotal / total < 0.15) return null;

      return {
        ruleId: 'small-frequent',
        severity: 'info',
        magnitude: clamp01(smallTotal / total),
        params: {
          amount: input.formatAmount(smallTotal),
          unit: input.unit,
          count: smallExpenses.length,
          pct: Math.round((smallTotal / total) * 100),
        },
      };
    },
  },
  {
    id: 'starter-fallback',
    minDataRequirement: {},
    evaluate: (input) => ({
      ruleId: 'starter-fallback',
      severity: 'info',
      magnitude: 0.1,
      params: { count: Math.max(0, 5 - input.thisMonthExpenses.length) },
    }),
  },
];
