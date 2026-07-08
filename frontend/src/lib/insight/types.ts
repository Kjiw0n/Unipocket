import type { CategoryId } from '@/types/category';
import type { CurrencyType } from '@/types/currency';

import type { GetAnalysisResponse } from '@/api/account-books/type';

export type InsightSeverity = 'positive' | 'info' | 'warning' | 'alert';

export type InsightRuleId =
  | 'category-overspend'
  | 'category-surge'
  | 'monthly-pace'
  | 'budget-burn'
  | 'weekly-trend'
  | 'repeat-merchant'
  | 'cash-card-shift'
  | 'weekday-pattern'
  | 'anomaly-expense'
  | 'no-spend-streak'
  | 'uncategorized-nudge'
  | 'small-frequent'
  | 'category-saving'
  | 'starter-fallback'
  | 'no-insight-fallback';

export interface NormalizedExpense {
  amount: number;
  category: CategoryId;
  occurredAt: Date;
  merchantName: string;
  isCash: boolean;
}

export interface InsightInput {
  year: number;
  month: number;
  isCurrentMonth: boolean;
  today: Date;
  daysInMonth: number;
  elapsedDays: number;
  currencyType: CurrencyType;
  analysis: GetAnalysisResponse;
  thisMonthExpenses: NormalizedExpense[];
  lastMonthExpenses: NormalizedExpense[];
  budget: { budget: number; spent: number } | null;
  formatAmount: (amount: number) => string;
  unit: string;
  isPartialExpenseData?: boolean;
}

export interface InsightCandidate {
  ruleId: InsightRuleId;
  severity: InsightSeverity;
  magnitude: number;
  categoryId?: CategoryId;
  params: Record<string, string | number>;
}

export interface InsightRule {
  id: InsightRuleId;
  minDataRequirement: {
    minTxCount?: number;
    needsLastMonth?: boolean;
    needsBudget?: boolean;
    currentMonthOnly?: boolean;
  };
  evaluate: (input: InsightInput) => InsightCandidate | null;
}

export interface Insight extends InsightCandidate {
  score: number;
  segments: { text: string; emphasis: boolean }[];
  description?: string;
}
