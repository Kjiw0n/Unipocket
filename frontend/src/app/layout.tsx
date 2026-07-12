import '@/styles/index.css';

import type { Metadata } from 'next';
import Script from 'next/script';

import { Providers } from './providers';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: 'Unipocket',
  description:
    '교환학생 맞춤형 통합 가계부 — 국내외 카드·현금 지출을 한 번에 기록하고, 동일 국가 학생과 소비를 비교하세요.',
  icons: { icon: '/cdn-assets/unipocket.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
        {GA_MEASUREMENT_ID && (
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
        )}
      </body>
    </html>
  );
}
