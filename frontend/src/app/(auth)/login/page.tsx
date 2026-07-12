'use client';

import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

import LoginPage from '@/screens/LoginPage';

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-dvh" />}>
      <LoginPage />
    </Suspense>
  );
}
