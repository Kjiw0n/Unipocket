import * as Sentry from '@sentry/react';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { HTTP_STATUS } from '@/api/config/constants';
import { ApiError } from '@/api/config/error';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (error instanceof ApiError && error.status === HTTP_STATUS.UNAUTHORIZED) return;
      if (error instanceof ApiError && error.status === HTTP_STATUS.NETWORK_ERROR) {
        toast.error('인터넷 연결을 확인해주세요.');
        return;
      }
      Sentry.captureException(error);
      const errorMessage = query.meta?.errorMessage as string;
      toast.error(errorMessage || '데이터를 불러오는데 실패했습니다.');
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      if (error instanceof ApiError && error.status === HTTP_STATUS.UNAUTHORIZED) return;
      if (error instanceof ApiError && error.status === HTTP_STATUS.NETWORK_ERROR) {
        toast.error('인터넷 연결을 확인해주세요.');
        return;
      }
      Sentry.captureException(error);
      const serverMessage = error instanceof ApiError ? error.message : null;
      const metaMessage = mutation.meta?.errorMessage as string;
      toast.error(serverMessage || metaMessage || '요청에 실패했어요.');
    },
  }),
  defaultOptions: {
    queries: { retry: false },
    mutations: { networkMode: 'always' },
  },
});
