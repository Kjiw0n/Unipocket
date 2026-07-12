'use client';

import * as Sentry from '@sentry/nextjs';
import { QueryClientProvider } from '@tanstack/react-query';

import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import ParseSnackbarContainer from '@/components/upload/ParseSnackbarContainer';

import { queryClient } from '@/lib/queryClient';

import { AnalyticsListener } from './analytics-listener';

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
          <div className="bg-background-alternative h-full">{children}</div>
          <ParseSnackbarContainer />
          <Toaster />
          <AnalyticsListener />
        </TooltipProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}
