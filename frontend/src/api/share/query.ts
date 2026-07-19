import { useMutation } from '@tanstack/react-query';

import { createReportShare } from '@/api/share/api';

export const useCreateReportShareMutation = () =>
  useMutation({
    mutationFn: createReportShare,
    meta: { errorMessage: '공유 링크 생성에 실패했어요.' },
  });
