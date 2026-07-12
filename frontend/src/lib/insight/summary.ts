import type { InsightSummaryFact } from '@/api/insights/type';

import type { Insight } from './types';

const MAX_MERCHANT_LENGTH = 60;
const FALLBACK_RULE_IDS = new Set(['starter-fallback', 'no-insight-fallback']);

export const buildInsightSummaryFacts = (
  insights: Insight[],
): InsightSummaryFact[] =>
  insights.map(({ ruleId, severity, params }) => ({
    ruleId,
    severity,
    params: Object.fromEntries(
      Object.entries(params).map(([key, value]) => [
        key,
        key === 'merchant' && typeof value === 'string'
          ? value.slice(0, MAX_MERCHANT_LENGTH)
          : value,
      ]),
    ),
  }));

export const hasMeaningfulInsights = (insights: Insight[]): boolean =>
  insights.some((insight) => !FALLBACK_RULE_IDS.has(insight.ruleId));
