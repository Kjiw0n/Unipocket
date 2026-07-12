import type { CurrencyType } from '@/types/currency';

import type { InsightRuleId, InsightSeverity } from '@/lib/insight/types';

export interface InsightSummaryFact {
  ruleId: InsightRuleId;
  severity: InsightSeverity;
  params: Record<string, string | number>;
}

export interface GetInsightSummaryRequest {
  accountBookId: number;
  year: number;
  month: number;
  currencyType: CurrencyType;
  facts: InsightSummaryFact[];
}

export interface GetInsightSummaryResponse {
  summary: string | null;
  generatedAt: string | null;
  cached: boolean;
}
