'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { Skeleton } from '@/components/ui/skeleton';

import { requireGuest } from '@/api/auth/api';
import { useAccountBookStore } from '@/stores/accountBookStore';

export function GuestGuard({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    let cancelled = false;
    void requireGuest()
      .then((result) => {
        if (cancelled) return;
        if (result.kind === 'redirect') {
          router.replace(result.to);
          return;
        }
        useAccountBookStore.getState().clearAccountBook();
        setReady(true);
      })
      .catch((caught) => {
        if (!cancelled) setError(caught);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (error) throw error;
  return ready ? children : <Skeleton className="h-dvh" />;
}
