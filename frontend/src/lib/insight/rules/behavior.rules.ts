import { clamp01, groupBy, sum } from '../stats';
import type { InsightRule } from '../types';

const WEEKDAY_NAMES = [
  '일요일',
  '월요일',
  '화요일',
  '수요일',
  '목요일',
  '금요일',
  '토요일',
];

export const behaviorRules: InsightRule[] = [
  {
    id: 'repeat-merchant',
    minDataRequirement: { minTxCount: 8 },
    evaluate: (input) => {
      const total = sum(
        input.thisMonthExpenses.map((expense) => expense.amount),
      );
      const candidate = [
        ...groupBy(
          input.thisMonthExpenses,
          (expense) => expense.merchantName,
        ).entries(),
      ]
        .map(([merchant, expenses]) => ({
          merchant,
          count: expenses.length,
          amount: sum(expenses.map((expense) => expense.amount)),
        }))
        .filter(({ count, amount }) => count >= 4 && amount / total >= 0.05)
        .sort((a, b) => b.amount - a.amount)[0];

      if (!candidate) return null;

      return {
        ruleId: 'repeat-merchant',
        severity: candidate.amount / total >= 0.15 ? 'warning' : 'info',
        magnitude: clamp01(candidate.amount / total),
        params: {
          merchant: candidate.merchant,
          count: candidate.count,
          amount: input.formatAmount(candidate.amount),
          unit: input.unit,
        },
      };
    },
  },
  {
    id: 'cash-card-shift',
    minDataRequirement: { minTxCount: 5, needsLastMonth: true },
    evaluate: (input) => {
      if (input.lastMonthExpenses.length < 5) return null;
      const getCashRatio = (expenses: typeof input.thisMonthExpenses) => {
        const total = sum(expenses.map((expense) => expense.amount));
        const cash = sum(
          expenses
            .filter((expense) => expense.isCash)
            .map((expense) => expense.amount),
        );
        return total > 0 ? cash / total : 0;
      };
      const delta =
        getCashRatio(input.thisMonthExpenses) -
        getCashRatio(input.lastMonthExpenses);
      if (Math.abs(delta) < 0.15) return null;

      return {
        ruleId: 'cash-card-shift',
        severity: 'info',
        magnitude: clamp01(Math.abs(delta)),
        params: {
          delta: Math.round(Math.abs(delta) * 100),
          direction: delta > 0 ? '늘었어요' : '줄었어요',
        },
      };
    },
  },
  {
    id: 'weekday-pattern',
    minDataRequirement: { minTxCount: 15 },
    evaluate: (input) => {
      const total = sum(
        input.thisMonthExpenses.map((expense) => expense.amount),
      );
      const candidate = [
        ...groupBy(input.thisMonthExpenses, (expense) =>
          expense.occurredAt.getDay(),
        ).entries(),
      ]
        .map(([weekday, expenses]) => ({
          weekday,
          count: expenses.length,
          amount: sum(expenses.map((expense) => expense.amount)),
        }))
        .filter(({ count, amount }) => count >= 3 && amount / total >= 0.3)
        .sort((a, b) => b.amount - a.amount)[0];

      if (!candidate) return null;

      return {
        ruleId: 'weekday-pattern',
        severity: 'info',
        magnitude: clamp01(candidate.amount / total),
        params: {
          weekday: WEEKDAY_NAMES[candidate.weekday],
          pct: Math.round((candidate.amount / total) * 100),
        },
      };
    },
  },
];
