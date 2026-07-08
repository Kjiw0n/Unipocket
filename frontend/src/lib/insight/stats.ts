import type { CategoryId } from '@/types/category';

import type { NormalizedExpense } from './types';

export const toNumber = (value: string | number | null | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const sum = (values: number[]): number =>
  values.reduce((total, value) => total + value, 0);

export const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

export const groupBy = <T, K extends string | number>(
  items: T[],
  getKey: (item: T) => K,
): Map<K, T[]> => {
  const groups = new Map<K, T[]>();
  items.forEach((item) => {
    const key = getKey(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  });
  return groups;
};

export const sumByCategory = (
  expenses: NormalizedExpense[],
): Map<CategoryId, number> => {
  const totals = new Map<CategoryId, number>();
  expenses.forEach((expense) => {
    totals.set(
      expense.category,
      (totals.get(expense.category) ?? 0) + expense.amount,
    );
  });
  return totals;
};

export const quantile = (values: number[], q: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] === undefined
    ? sorted[base]
    : sorted[base] + rest * (sorted[base + 1] - sorted[base]);
};

export const daysInMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate();

export const elapsedDaysInMonth = (
  year: number,
  month: number,
  today: Date,
): number => {
  if (year !== today.getFullYear() || month !== today.getMonth() + 1) {
    return daysInMonth(year, month);
  }
  return Math.max(1, Math.min(today.getDate(), daysInMonth(year, month)));
};

export const formatDateParam = (date: Date): string =>
  `${date.getMonth() + 1}/${date.getDate()}`;

export const getLongestNoSpendStreak = (
  expenses: NormalizedExpense[],
  elapsedDays: number,
): number => {
  const spendDays = new Set(
    expenses.map((expense) => expense.occurredAt.getDate()),
  );
  let longest = 0;
  let current = 0;

  for (let day = 1; day <= elapsedDays; day += 1) {
    if (spendDays.has(day)) {
      current = 0;
    } else {
      current += 1;
      longest = Math.max(longest, current);
    }
  }

  return longest;
};
