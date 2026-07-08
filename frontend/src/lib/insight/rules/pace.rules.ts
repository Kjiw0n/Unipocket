import { clamp01, groupBy, sum, toNumber } from '../stats';
import type { InsightRule } from '../types';

const PACE_RATIO_THRESHOLD = 0.2;
const BUDGET_FAST_THRESHOLD = 1.15;
const BUDGET_SLOW_THRESHOLD = 0.8;
const WEEKLY_TREND_THRESHOLD = 1.3;

const getWeekOfMonth = (date: Date) => Math.floor((date.getDate() - 1) / 7);

const getLastMonthToDate = (input: Parameters<InsightRule['evaluate']>[0]) => {
  const { compareWithLastMonth } = input.analysis;
  const targetIndex =
    Math.min(
      compareWithLastMonth.thisMonthCount,
      compareWithLastMonth.lastMonthCount,
      compareWithLastMonth.prevMonthItem.length,
    ) - 1;

  if (targetIndex < 0) return 0;
  return toNumber(
    compareWithLastMonth.prevMonthItem[targetIndex]?.cumulatedAmount,
  );
};

const getCompletedWeekCount = (
  input: Parameters<InsightRule['evaluate']>[0],
) => {
  if (!input.isCurrentMonth) {
    return (
      getWeekOfMonth(new Date(input.year, input.month - 1, input.daysInMonth)) +
      1
    );
  }

  return Math.floor(input.elapsedDays / 7);
};

export const paceRules: InsightRule[] = [
  {
    id: 'monthly-pace',
    minDataRequirement: { minTxCount: 3 },
    evaluate: (input) => {
      const diff = toNumber(input.analysis.compareWithLastMonth.diff);
      const lastMonthToDate = getLastMonthToDate(input);
      if (lastMonthToDate <= 0) return null;

      const paceRatio = Math.abs(diff) / lastMonthToDate;
      if (paceRatio < PACE_RATIO_THRESHOLD) return null;

      const isLess = diff < 0;
      return {
        ruleId: 'monthly-pace',
        severity: isLess ? 'positive' : 'warning',
        magnitude: clamp01(paceRatio),
        params: {
          amount: input.formatAmount(Math.abs(diff)),
          unit: input.unit,
          direction: isLess ? '덜' : '더',
          pct: Math.round(paceRatio * 100),
          description: isLess
            ? '지난달보다 좋은 속도로 관리하고 있어요.'
            : '남은 기간에는 고정 지출과 반복 지출을 점검해보세요.',
        },
      };
    },
  },
  {
    id: 'budget-burn',
    minDataRequirement: { needsBudget: true, currentMonthOnly: true },
    evaluate: (input) => {
      if (input.currencyType !== 'BASE') return null;
      if (!input.budget) return null;
      const spentPct = input.budget.spent / input.budget.budget;
      const elapsedPct = input.elapsedDays / input.daysInMonth;
      if (elapsedPct <= 0) return null;
      const burnRate = spentPct / elapsedPct;

      if (
        burnRate < BUDGET_FAST_THRESHOLD &&
        burnRate > BUDGET_SLOW_THRESHOLD
      ) {
        return null;
      }

      const predictedDay = Math.max(
        input.elapsedDays,
        Math.min(
          input.daysInMonth,
          Math.ceil(input.elapsedDays / Math.max(spentPct, 0.01)),
        ),
      );

      return {
        ruleId: 'budget-burn',
        severity:
          burnRate <= BUDGET_SLOW_THRESHOLD
            ? 'positive'
            : burnRate >= 1.4
              ? 'alert'
              : 'warning',
        magnitude: clamp01(Math.abs(1 - burnRate)),
        params: {
          spentPct: Math.round(spentPct * 100),
          pacePct: Math.round(Math.abs(burnRate - 1) * 100),
          predictedDay,
          paceStatus: burnRate <= BUDGET_SLOW_THRESHOLD ? 'slow' : 'fast',
        },
      };
    },
  },
  {
    id: 'weekly-trend',
    minDataRequirement: { minTxCount: 12 },
    evaluate: (input) => {
      const completedWeekCount = getCompletedWeekCount(input);
      if (completedWeekCount < 3) return null;

      const totalsByWeek = groupBy(input.thisMonthExpenses, (expense) =>
        getWeekOfMonth(expense.occurredAt),
      );
      const weekTotals = Array.from({ length: completedWeekCount }, (_, week) =>
        sum((totalsByWeek.get(week) ?? []).map((expense) => expense.amount)),
      );

      if (weekTotals.length < 3) return null;
      const recent = weekTotals.slice(-3);
      if (recent.some((amount) => amount <= 0)) return null;

      const isIncreasing = recent[0] < recent[1] && recent[1] < recent[2];
      const slope = recent[2] / recent[0];
      if (!isIncreasing || slope < WEEKLY_TREND_THRESHOLD) return null;

      return {
        ruleId: 'weekly-trend',
        severity: 'warning',
        magnitude: clamp01(slope - 1),
        params: { pct: Math.round((slope - 1) * 100) },
      };
    },
  },
];
