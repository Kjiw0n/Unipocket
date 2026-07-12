import { customFetch } from '@/api/config/client';
import type {
  GetInsightSummaryRequest,
  GetInsightSummaryResponse,
} from '@/api/insights/type';

// 서버가 가계부 소유권 확인(최대 5초) + Gemini 요약 생성(최대 10초)을 순차로 수행할 수 있어
// 기본 타임아웃(5초)보다 여유를 둔다. 네트워크 왕복 시간을 감안한 값.
const INSIGHT_SUMMARY_TIMEOUT_MS = 20_000;

export const getInsightSummary = (
  data: GetInsightSummaryRequest,
): Promise<GetInsightSummaryResponse> =>
  customFetch({
    endpoint: 'insights/summary',
    options: {
      method: 'POST',
      body: JSON.stringify(data),
    },
    timeout: INSIGHT_SUMMARY_TIMEOUT_MS,
  });
