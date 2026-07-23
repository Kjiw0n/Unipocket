'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

import { GA_MEASUREMENT_ID } from '@/config/env';
import { isAnalyticsExcludedPath, trackPageView } from '@/lib/analytics';

export function AnalyticsScripts() {
  const pathname = usePathname();
  const isExcluded = isAnalyticsExcludedPath(pathname);
  const [isGaReady, setIsGaReady] = useState(false);
  const lastTrackedPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    if (isExcluded) {
      lastTrackedPathnameRef.current = null;
      return;
    }

    if (!isGaReady || lastTrackedPathnameRef.current === pathname) return;

    trackPageView(pathname);
    lastTrackedPathnameRef.current = pathname;
  }, [isExcluded, isGaReady, pathname]);

  if (!GA_MEASUREMENT_ID || isExcluded) return null;

  return (
    <>
      <Script
        id="ga-init"
        strategy="afterInteractive"
        onReady={() => setIsGaReady(true)}
      >
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });`}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
    </>
  );
}
