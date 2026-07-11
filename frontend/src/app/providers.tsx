'use client';

import * as Sentry from '@sentry/react';
import { QueryClientProvider } from '@tanstack/react-query';

import { TooltipProvider } from '@/components/ui/tooltip';

import { queryClient } from '@/lib/queryClient';

const TOOLTIP_DELAY_DURATION = 300;

export function Providers({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Sentry.ErrorBoundary
      fallback={<p>오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={TOOLTIP_DELAY_DURATION}>
          {children}
        </TooltipProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}
