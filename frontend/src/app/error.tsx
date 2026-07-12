'use client';

import { ErrorFallback } from '@/components/common/ErrorFallback';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="서비스 이용에 불편을 드려 죄송합니다."
    />
  );
}
