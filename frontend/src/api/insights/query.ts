import { useQuery } from '@tanstack/react-query';

import { getInsightSummary } from '@/api/insights/api';
import type { GetInsightSummaryRequest } from '@/api/insights/type';

export const insightSummaryKeys = {
  all: ['insightSummary'] as const,
  detail: ({
    accountBookId,
    year,
    month,
    currencyType,
    facts,
  }: GetInsightSummaryRequest) =>
    [
      ...insightSummaryKeys.all,
      accountBookId,
      year,
      month,
      currencyType,
      facts,
    ] as const,
};

export const useInsightSummaryQuery = (
  request: GetInsightSummaryRequest,
  enabled: boolean,
  isPastMonth: boolean,
) =>
  useQuery({
    queryKey: insightSummaryKeys.detail(request),
    queryFn: () => getInsightSummary(request),
    enabled,
    staleTime: isPastMonth ? Infinity : 0,
    meta: {
      suppressErrorToast: true,
    },
  });
