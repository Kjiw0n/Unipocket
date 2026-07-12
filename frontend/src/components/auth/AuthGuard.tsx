'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Skeleton } from '@/components/ui/skeleton';

import {
  accountBookAmountQueryOptions,
  accountBookDetailQueryOptions,
  accountBooksQueryOptions,
} from '@/api/account-books/query';
import { requireAuth } from '@/api/auth/api';
import { queryClient } from '@/lib/queryClient';
import { useAccountBookStore } from '@/stores/accountBookStore';

export function AuthGuard({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    let cancelled = false;

    async function guard() {
      const { accountBook, setAccountBook, clearAccountBook } =
        useAccountBookStore.getState();
      const storedId = accountBook?.accountBookId;
      const accountBooksPromise = queryClient.fetchQuery(
        accountBooksQueryOptions,
      );
      const storedDetailPromise = storedId
        ? queryClient.fetchQuery(accountBookDetailQueryOptions(storedId))
        : null;
      const storedAmountPromise = storedId
        ? queryClient.fetchQuery(accountBookAmountQueryOptions(storedId))
        : null;

      accountBooksPromise.catch(() => {});
      storedDetailPromise?.catch(() => {});
      storedAmountPromise?.catch(() => {});

      const authResult = await requireAuth();
      if (cancelled) return;
      if (authResult.kind === 'redirect') {
        router.replace(authResult.to);
        return;
      }

      if (authResult.user.needsOnboarding) {
        if (pathname !== '/init') {
          clearAccountBook();
          router.replace('/init');
        } else {
          setReady(true);
        }
        return;
      }

      const accountBooks = await accountBooksPromise;
      if (cancelled) return;
      if (!accountBooks || accountBooks.length === 0) {
        clearAccountBook();
        if (pathname === '/init') setReady(true);
        else router.replace('/init');
        return;
      }

      if (pathname === '/init') {
        router.replace('/home');
        return;
      }

      const isStoredValid =
        !!storedId &&
        accountBooks.some((book) => book.accountBookId === storedId);
      const resolvedId = isStoredValid
        ? storedId
        : accountBooks[0].accountBookId;
      const amountPromise = isStoredValid
        ? storedAmountPromise
        : queryClient.fetchQuery(accountBookAmountQueryOptions(resolvedId));
      amountPromise?.catch(() => {});

      try {
        const detail =
          isStoredValid && storedDetailPromise
            ? await storedDetailPromise
            : await queryClient.fetchQuery(
                accountBookDetailQueryOptions(resolvedId),
              );
        if (!cancelled) {
          setAccountBook(detail);
          setReady(true);
        }
      } catch (caught) {
        clearAccountBook();
        if (!cancelled) setError(caught);
      }
    }

    void guard().catch((caught) => {
      useAccountBookStore.getState().clearAccountBook();
      if (!cancelled) setError(caught);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (error) throw error;
  return ready ? children : <Skeleton className="h-dvh" />;
}
