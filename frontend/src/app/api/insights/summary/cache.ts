import { unstable_cache } from 'next/cache';

import type { GetInsightSummaryRequest } from '@/api/insights/type';

import { generateInsightSummary } from './gemini';

export interface CachedInsightSummary {
  summary: string;
  generatedAt: string;
  generationId: string;
}

const buildCacheKey = ({
  accountBookId,
  year,
  month,
  currencyType,
}: GetInsightSummaryRequest) => [
  'insight-summary',
  String(accountBookId),
  `${year}-${String(month).padStart(2, '0')}`,
  currencyType,
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

export const getPastInsightSummary = (
  request: GetInsightSummaryRequest,
  generationId: string,
) =>
  unstable_cache(
    () => createSummary(request, generationId),
    [...buildCacheKey(request), 'past'],
    { revalidate: false },
  )();

export const getCurrentInsightSummary = (
  request: GetInsightSummaryRequest,
  generationId: string,
) =>
  unstable_cache(
    () => createSummary(request, generationId),
    [...buildCacheKey(request), 'current'],
    { revalidate: 86_400 },
  )();
