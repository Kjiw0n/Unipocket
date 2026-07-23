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

  return null;
}
