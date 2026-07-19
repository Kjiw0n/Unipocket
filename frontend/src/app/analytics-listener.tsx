'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { isAnalyticsExcludedPath } from '@/lib/analytics';
import { initHotjar } from '@/lib/hotjar';

export function AnalyticsListener() {
  const pathname = usePathname();
  const isExcluded = isAnalyticsExcludedPath(pathname);

  useEffect(() => {
    if (isExcluded) return;
    initHotjar();
  }, [isExcluded]);

  useEffect(() => {
    if (isExcluded) return;
    window.gtag?.('event', 'page_view', { page_path: pathname });
  }, [isExcluded, pathname]);

  return null;
}
