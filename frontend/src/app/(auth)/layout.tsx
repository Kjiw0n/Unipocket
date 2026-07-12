'use client';

import { GuestGuard } from '@/components/auth/GuestGuard';
import LandingHeader from '@/components/landing-page/LandingHeader';

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <GuestGuard>
      <div className="flex min-h-screen flex-col">
        <LandingHeader />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </GuestGuard>
  );
}
