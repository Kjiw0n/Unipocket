'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

import { GA_MEASUREMENT_ID } from '@/config/env';
import { isAnalyticsExcludedPath } from '@/lib/analytics';

export function AnalyticsScripts() {
  const pathname = usePathname();

  if (!GA_MEASUREMENT_ID || isAnalyticsExcludedPath(pathname)) return null;

  return (
    <>
      <Script id="ga-init" strategy="afterInteractive">
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
