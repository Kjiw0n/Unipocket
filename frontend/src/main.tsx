import '@/styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';

import { TooltipProvider } from '@/components/ui/tooltip';

import { initAnalytics } from '@/lib/analytics';
import { queryClient } from '@/lib/queryClient';
import { initSentry } from '@/lib/sentry';
import { routeTree } from '@/routeTree.gen';

initSentry();

const TOOLTIP_DELAY_DURATION = 300;

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

initAnalytics(router);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={<p>오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={TOOLTIP_DELAY_DURATION}>
          <RouterProvider router={router} />
        </TooltipProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
