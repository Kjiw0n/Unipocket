'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import Header from '@/components/layout/Header';
import Menu from '@/components/layout/menu/Menu';

import { useRefreshStore } from '@/stores/refreshStore';

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const refreshKey = useRefreshStore((state) => state.refreshKey);
  return (
    <AuthGuard>
      <div className="flex h-dvh overflow-hidden">
        <Menu />
        <div className="flex flex-1 flex-col">
          <Header />
          <main key={refreshKey} className="flex min-h-0 flex-1 flex-col">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
