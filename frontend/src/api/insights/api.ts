import { customFetch } from '@/api/config/client';
import type {
  GetInsightSummaryRequest,
  GetInsightSummaryResponse,
} from '@/api/insights/type';

export const getInsightSummary = (
  data: GetInsightSummaryRequest,
): Promise<GetInsightSummaryResponse> =>
  customFetch({
    endpoint: 'insights/summary',
    options: {
      method: 'POST',
      body: JSON.stringify(data),
    },
  });
