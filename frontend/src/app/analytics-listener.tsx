'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { initHotjar } from '@/lib/hotjar';

export function AnalyticsListener() {
  const pathname = usePathname();

  useEffect(() => {
    initHotjar();
  }, []);

  useEffect(() => {
    window.gtag?.('event', 'page_view', { page_path: pathname });
  }, [pathname]);

  return null;
}
