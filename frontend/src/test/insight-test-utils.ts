import type { CategoryId } from '@/types/category';

import type { GetAnalysisResponse } from '@/api/account-books/type';
import type { Expense } from '@/api/expenses/type';
import type { InsightInput, NormalizedExpense } from '@/lib/insight/types';

export const buildAnalysis = ({
  items = [],
  diff = '0',
  thisMonthCount = 10,
  lastMonthCount = 10,
  prevMonthItem = [],
  lastMonthTotal = '1000',
}: {
  items?: GetAnalysisResponse['compareByCategory']['items'];
  diff?: string;
  thisMonthCount?: number;
  lastMonthCount?: number;
  prevMonthItem?: GetAnalysisResponse['compareWithLastMonth']['prevMonthItem'];
  lastMonthTotal?: string;
} = {}): GetAnalysisResponse => ({
  countryCode: 'KR',
  compareWithAverage: {
    month: 7,
    mySpentAmount: '0',
    averageSpentAmount: '0',
    spentAmountDiff: '0',
  },
  compareWithLastMonth: {
    diff,
    thisMonth: '7월',
    thisMonthCount,
    lastMonth: '6월',
    lastMonthCount,
    totalSpent: {
      thisMonthToDate: '0',
      lastMonthTotal,
    },
    thisMonthSpent: '0',
    thisMonthItem: [],
    prevMonthItem,
  },
  compareByCategory: {
    maxDiffCategoryIndex: 2,
    isOverSpent: true,
    maxLabel: '식비',
    items,
  },
});

export const buildNormalizedExpense = (
  overrides: Partial<NormalizedExpense> = {},
): NormalizedExpense => ({
  amount: 100,
  category: 2,
  occurredAt: new Date('2026-07-01T00:00:00'),
  merchantName: '식당',
  isCash: false,
  ...overrides,
});

export const buildInput = (
  overrides: Partial<InsightInput> = {},
): InsightInput => ({
  year: 2026,
  month: 7,
  isCurrentMonth: true,
  today: new Date('2026-07-15T00:00:00'),
  daysInMonth: 31,
  elapsedDays: 15,
  currencyType: 'BASE',
  analysis: buildAnalysis(),
  thisMonthExpenses: Array.from({ length: 5 }, (_, index) =>
    buildNormalizedExpense({ occurredAt: new Date(2026, 6, index + 1) }),
  ),
  lastMonthExpenses: [],
  budget: null,
  formatAmount: (amount) => Math.round(amount).toLocaleString('ko-KR'),
  unit: '원',
  ...overrides,
});

export const buildExpense = (overrides: Partial<Expense> = {}): Expense => ({
  expenseId: 1,
  accountBookId: 1,
  travel: null,
  merchantName: '식당',
  exchangeRate: 1,
  category: 2 as CategoryId,
  paymentMethod: { isCash: false, card: null },
  occurredAt: '2026-07-01T00:00:00',
  updatedAt: '2026-07-01T00:00:00',
  localCurrencyAmount: 1000,
  localCurrencyCode: 'KRW',
  baseCurrencyAmount: 500,
  baseCurrencyCode: 'KRW',
  source: 'MANUAL',
  approvalNumber: null,
  cardNumber: null,
  fileLink: null,
  ...overrides,
});
