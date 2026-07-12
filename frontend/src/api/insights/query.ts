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
  }: GetInsightSummaryRequest) =>
    [
      ...insightSummaryKeys.all,
      accountBookId,
      year,
      month,
      currencyType,
    ] as const,
};

export const useInsightSummaryQuery = (
  request: GetInsightSummaryRequest,
  enabled: boolean,
) =>
  useQuery({
    queryKey: insightSummaryKeys.detail(request),
    queryFn: () => getInsightSummary(request),
    enabled,
    staleTime:
      request.year < new Date().getFullYear() ||
      (request.year === new Date().getFullYear() &&
        request.month < new Date().getMonth() + 1)
        ? Infinity
        : 0,
    meta: {
      suppressErrorToast: true,
    },
  });
