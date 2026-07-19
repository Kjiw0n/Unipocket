import { customFetch } from '@/api/config/client';
import { ENDPOINTS } from '@/api/config/endpoint';
import type {
  CreateReportShareRequest,
  CreateReportShareResponse,
} from '@/api/share/type';

const REPORT_SHARE_TIMEOUT_MS = 20_000;

export const createReportShare = (
  data: CreateReportShareRequest,
): Promise<CreateReportShareResponse> =>
  customFetch({
    endpoint: ENDPOINTS.SHARE.REPORT,
    options: {
      method: 'POST',
      body: JSON.stringify(data),
    },
    timeout: REPORT_SHARE_TIMEOUT_MS,
  });
