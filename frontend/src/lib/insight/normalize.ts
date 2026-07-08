import { type CategoryId } from '@/types/category';
import type { CurrencyType } from '@/types/currency';

import type { Expense, GetExpensesResponse } from '@/api/expenses/type';
import type { GetBudgetWidgetResponse } from '@/api/widget/type';
import { formatToISODateTime } from '@/lib/utils';

import { daysInMonth, elapsedDaysInMonth, toNumber } from './stats';
import type { InsightInput, NormalizedExpense } from './types';

const INCOME_CATEGORY_ID: CategoryId = 9;

export const normalizeExpenses = (
  expenses: Expense[],
  currencyType: CurrencyType,
): NormalizedExpense[] =>
  expenses
    .filter((expense) => expense.category !== INCOME_CATEGORY_ID)
    .map((expense) => ({
      amount:
        currencyType === 'LOCAL'
          ? toNumber(expense.localCurrencyAmount)
          : toNumber(expense.baseCurrencyAmount),
      category: expense.category,
      occurredAt: new Date(expense.occurredAt),
      merchantName: expense.merchantName.trim() || '알 수 없는 거래처',
      isCash: expense.paymentMethod.isCash,
    }))
    .filter(
      (expense) =>
        expense.amount > 0 && !Number.isNaN(expense.occurredAt.getTime()),
    );

export const normalizeBudget = (
  budget: GetBudgetWidgetResponse | undefined,
  currencyType: CurrencyType,
): InsightInput['budget'] => {
  if (!budget) return null;

  const budgetAmount = toNumber(budget.budget);
  if (budgetAmount <= 0) return null;

  return {
    budget: budgetAmount,
    spent:
      currencyType === 'LOCAL'
        ? toNumber(budget.localSpentAmount)
        : toNumber(budget.baseSpentAmount),
  };
};

export const buildExpenseFilter = (year: number, month: number) => {
  const endDay = daysInMonth(year, month);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month - 1, endDay);

  return {
    startDate: formatToISODateTime(startDate, false),
    endDate: formatToISODateTime(endDate, true),
    page: 0,
    size: 1000,
  };
};

export const getPreviousYearMonth = (year: number, month: number) => {
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
};

export const isPartialExpenseResponse = (
  response: GetExpensesResponse,
): boolean => response.totalCount > response.expenses.length;

export const buildInsightDateMeta = (
  year: number,
  month: number,
  isCurrentMonth: boolean,
  today: Date,
) => ({
  daysInMonth: daysInMonth(year, month),
  elapsedDays: isCurrentMonth
    ? elapsedDaysInMonth(year, month, today)
    : daysInMonth(year, month),
});
