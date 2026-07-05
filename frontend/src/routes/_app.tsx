import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import Header from '@/components/layout/Header';
import Menu from '@/components/layout/menu/Menu';
import { Skeleton } from '@/components/ui/skeleton';

import {
  accountBookAmountQueryOptions,
  accountBookDetailQueryOptions,
  accountBooksQueryOptions,
} from '@/api/account-books/query';
import { requireAuth } from '@/api/auth/api';
import { useAccountBookStore } from '@/stores/accountBookStore';
import { useRefreshStore } from '@/stores/refreshStore';

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context, location }) => {
    const { queryClient } = context;
    const { accountBook, setAccountBook, clearAccountBook } =
      useAccountBookStore.getState();
    const storedId = accountBook?.accountBookId;

    // 인증 확인·가계부 목록·직전 사용 가계부 상세·금액을 병렬 처리
    const accountBooksPromise = queryClient.fetchQuery(
      accountBooksQueryOptions,
    );
    const storedDetailPromise = storedId
      ? queryClient.fetchQuery(accountBookDetailQueryOptions(storedId))
      : null;
    const storedAmountPromise = storedId
      ? queryClient.fetchQuery(accountBookAmountQueryOptions(storedId))
      : null;

    // auth 실패 시 redirect 발생하므로 에러 처리 미진행
    accountBooksPromise.catch(() => {});
    storedDetailPromise?.catch(() => {});
    storedAmountPromise?.catch(() => {});

    const user = await requireAuth();

    if (user?.needsOnboarding) {
      if (location.pathname !== '/init') {
        clearAccountBook();
        throw redirect({ to: '/init' });
      }
      return;
    }

    const accountBooks = await accountBooksPromise;

    if (!accountBooks || accountBooks.length === 0) {
      clearAccountBook();
      if (location.pathname === '/init') return;
      throw redirect({ to: '/init' });
    }

    if (location.pathname === '/init') {
      throw redirect({ to: '/home' });
    }

    const isStoredValid =
      !!storedId && accountBooks.some((ab) => ab.accountBookId === storedId);

    const resolvedAccountBookId = isStoredValid
      ? storedId
      : accountBooks[0].accountBookId;

    const amountPromise = isStoredValid
      ? storedAmountPromise
      : queryClient.fetchQuery(
          accountBookAmountQueryOptions(resolvedAccountBookId),
        );
    amountPromise?.catch(() => {});

    try {
      const accountBookDetail =
        isStoredValid && storedDetailPromise
          ? await storedDetailPromise
          : await queryClient.fetchQuery(
              accountBookDetailQueryOptions(resolvedAccountBookId),
            );
      setAccountBook(accountBookDetail);
    } catch (error) {
      clearAccountBook();
      throw error;
    }
  },
  pendingComponent: () => <Skeleton className="h-dvh" />,
  component: AppLayout,
});

function AppLayout() {
  const refreshKey = useRefreshStore((s) => s.refreshKey);
  return (
    <div className="flex h-dvh overflow-hidden">
      <Menu />
      <div className="flex flex-1 flex-col">
        <Header />
        <main key={refreshKey} className="flex min-h-0 flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
