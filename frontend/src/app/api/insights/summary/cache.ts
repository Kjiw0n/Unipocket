import { createHash } from 'node:crypto';

import { unstable_cache } from 'next/cache';

import type {
  GetInsightSummaryRequest,
  InsightSummaryFact,
} from '@/api/insights/type';

import { generateInsightSummary } from './gemini';

export interface CachedInsightSummary {
  summary: string;
  generatedAt: string;
  generationId: string;
}

export const hashFacts = (facts: InsightSummaryFact[]): string => {
  const canonical = facts.map(({ ruleId, severity, params }) => ({
    ruleId,
    severity,
    params: Object.fromEntries(
      Object.keys(params)
        .sort()
        .map((key) => [key, params[key]]),
    ),
  }));

  return createHash('sha256')
    .update(JSON.stringify(canonical))
    .digest('hex')
    .slice(0, 16);
};

const buildCacheKey = ({
  accountBookId,
  year,
  month,
  currencyType,
  facts,
}: GetInsightSummaryRequest) => [
  'insight-summary',
  String(accountBookId),
  `${year}-${String(month).padStart(2, '0')}`,
  currencyType,
  hashFacts(facts),
];

const createSummary = async (
  request: GetInsightSummaryRequest,
  generationId: string,
): Promise<CachedInsightSummary> => ({
  summary: await generateInsightSummary(
    request.year,
    request.month,
    request.facts,
  ),
  generatedAt: new Date().toISOString(),
  generationId,
});

const inFlightRequests = new Map<string, Promise<CachedInsightSummary>>();

const withRequestDedup = (
  key: string,
  execute: () => Promise<CachedInsightSummary>,
): Promise<CachedInsightSummary> => {
  const existing = inFlightRequests.get(key);
  if (existing) return existing;
  const promise = execute().finally(() => inFlightRequests.delete(key));
  inFlightRequests.set(key, promise);
  return promise;
};

export const getPastInsightSummary = (
  request: GetInsightSummaryRequest,
  generationId: string,
) => {
  const key = [...buildCacheKey(request), 'past'];
  return withRequestDedup(key.join('::'), () =>
    unstable_cache(() => createSummary(request, generationId), key, {
      revalidate: false,
    })(),
  );
};

export const getCurrentInsightSummary = (
  request: GetInsightSummaryRequest,
  generationId: string,
) => {
  const key = [...buildCacheKey(request), 'current'];
  return withRequestDedup(key.join('::'), () =>
    unstable_cache(() => createSummary(request, generationId), key, {
      revalidate: 86_400,
    })(),
  );
};
