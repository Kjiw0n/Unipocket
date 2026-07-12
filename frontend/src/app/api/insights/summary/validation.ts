import type {
  GetInsightSummaryRequest,
  InsightSummaryFact,
} from '@/api/insights/type';
import type { InsightRuleId, InsightSeverity } from '@/lib/insight/types';

const RULE_IDS = new Set<InsightRuleId>([
  'category-overspend',
  'category-surge',
  'monthly-pace',
  'budget-burn',
  'weekly-trend',
  'repeat-merchant',
  'cash-card-shift',
  'weekday-pattern',
  'anomaly-expense',
  'no-spend-streak',
  'uncategorized-nudge',
  'small-frequent',
  'category-saving',
  'starter-fallback',
  'no-insight-fallback',
]);
const SEVERITIES = new Set<InsightSeverity>([
  'positive',
  'info',
  'warning',
  'alert',
]);
const FALLBACK_RULE_IDS = new Set<InsightRuleId>([
  'starter-fallback',
  'no-insight-fallback',
]);
const MAX_FACTS = 14;
const MAX_PARAMS = 12;
const MAX_PARAM_TEXT_LENGTH = 100;
const MAX_MERCHANT_LENGTH = 60;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sanitizeParams = (
  value: unknown,
): Record<string, string | number> | null => {
  if (!isRecord(value)) return null;
  const entries = Object.entries(value);
  if (entries.length > MAX_PARAMS) return null;

  const params: Record<string, string | number> = {};
  for (const [key, param] of entries) {
    if (typeof param === 'number') {
      if (!Number.isFinite(param)) return null;
      params[key] = param;
      continue;
    }
    if (typeof param !== 'string') return null;
    const maxLength =
      key === 'merchant' ? MAX_MERCHANT_LENGTH : MAX_PARAM_TEXT_LENGTH;
    params[key] = param.slice(0, maxLength);
  }
  return params;
};

const parseFact = (value: unknown): InsightSummaryFact | null => {
  if (!isRecord(value)) return null;
  const { ruleId, severity } = value;
  if (typeof ruleId !== 'string' || !RULE_IDS.has(ruleId as InsightRuleId))
    return null;
  if (
    typeof severity !== 'string' ||
    !SEVERITIES.has(severity as InsightSeverity)
  )
    return null;
  const params = sanitizeParams(value.params);
  if (!params) return null;
  return {
    ruleId: ruleId as InsightRuleId,
    severity: severity as InsightSeverity,
    params,
  };
};

export const parseInsightSummaryRequest = (
  value: unknown,
): GetInsightSummaryRequest | null => {
  if (!isRecord(value)) return null;
  const { accountBookId, year, month, currencyType, facts } = value;
  if (!Number.isInteger(accountBookId) || Number(accountBookId) <= 0)
    return null;
  if (!Number.isInteger(year) || Number(year) < 2000 || Number(year) > 2100)
    return null;
  if (!Number.isInteger(month) || Number(month) < 1 || Number(month) > 12)
    return null;
  if (currencyType !== 'BASE' && currencyType !== 'LOCAL') return null;
  if (!Array.isArray(facts) || facts.length === 0 || facts.length > MAX_FACTS)
    return null;

  const parsedFacts = facts.map(parseFact);
  if (parsedFacts.some((fact) => fact === null)) return null;

  return {
    accountBookId: Number(accountBookId),
    year: Number(year),
    month: Number(month),
    currencyType,
    facts: parsedFacts as InsightSummaryFact[],
  };
};

export const hasMeaningfulFacts = (facts: InsightSummaryFact[]): boolean =>
  facts.some((fact) => !FALLBACK_RULE_IDS.has(fact.ruleId));

export const getCurrentYearMonth = (
  date = new Date(),
  timeZone = 'Asia/Seoul',
) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(date);
  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
  };
};

export const compareYearMonth = (
  left: Pick<GetInsightSummaryRequest, 'year' | 'month'>,
  right: Pick<GetInsightSummaryRequest, 'year' | 'month'>,
) => left.year * 12 + left.month - (right.year * 12 + right.month);
