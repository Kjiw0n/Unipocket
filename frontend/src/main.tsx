import '@/styles/index.css';

import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { toast } from 'sonner';

import { TooltipProvider } from '@/components/ui/tooltip';

import { HTTP_STATUS } from '@/api/config/constants';
import { ApiError } from '@/api/config/error';
import { routeTree } from '@/routeTree.gen';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: import.meta.env.PROD ? 1.0 : 0,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE,
});

const TOOLTIP_DELAY_DURATION = 300;

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (
        error instanceof ApiError &&
        error.status === HTTP_STATUS.UNAUTHORIZED
      ) {
        return;
      }
      Sentry.captureException(error);
      const errorMessage = query.meta?.errorMessage as string;
      toast.error(errorMessage || '데이터를 불러오는데 실패했습니다.');
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (
        error instanceof ApiError &&
        error.status === HTTP_STATUS.UNAUTHORIZED
      ) {
        return;
      }
      Sentry.captureException(error);
    },
  }),
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
});

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

router.subscribe('onResolved', ({ toLocation }) => {
  window.gtag?.('event', 'page_view', {
    page_path: toLocation.pathname,
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<p>오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={TOOLTIP_DELAY_DURATION}>
          <RouterProvider router={router} />
        </TooltipProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
