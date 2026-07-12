import { type ReactNode, Suspense } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import * as Sentry from '@sentry/nextjs';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';

import { HTTP_STATUS } from '@/api/config/constants';
import { ApiError } from '@/api/config/error';

type QueryBoundaryVariant = 'section' | 'inline';

interface QueryBoundaryProps {
  pendingFallback: ReactNode;
  errorTitle?: string;
  variant?: QueryBoundaryVariant;
  resetKeys?: unknown[];
  children: ReactNode;
}

interface SectionErrorFallbackProps extends FallbackProps {
  title?: string;
  variant: QueryBoundaryVariant;
}

function SectionErrorFallback({
  error,
  resetErrorBoundary,
  title = '데이터를 불러오지 못했어요',
  variant,
}: SectionErrorFallbackProps) {
  // 401은 기존 루트 ErrorFallback의 로그인 리다이렉트 처리로 넘긴다.
  if (error instanceof ApiError && error.status === HTTP_STATUS.UNAUTHORIZED) {
    throw error;
  }

  const message =
    error instanceof Error ? error.message : '알 수 없는 오류가 발생했어요.';

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-3 py-1.5">
        <p className="text-sm text-red-600">{title}</p>
        <button
          type="button"
          onClick={resetErrorBoundary}
          className="text-sm font-medium text-red-800 underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-25 w-full flex-col items-center justify-center gap-3 rounded border border-red-200 bg-red-50 p-4">
      <h2 className="font-bold text-red-800">{title}</h2>
      <p className="text-red-600">{message}</p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="rounded bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
      >
        다시 시도
      </button>
    </div>
  );
}

export function QueryBoundary({
  pendingFallback,
  errorTitle,
  variant = 'section',
  resetKeys,
  children,
}: QueryBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      onReset={reset}
      resetKeys={resetKeys}
      onError={(error) => {
        if (!(error instanceof ApiError)) {
          Sentry.captureException(error);
        }
      }}
      fallbackRender={(fallbackProps) => (
        <SectionErrorFallback
          {...fallbackProps}
          title={errorTitle}
          variant={variant}
        />
      )}
    >
      <Suspense fallback={pendingFallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}
