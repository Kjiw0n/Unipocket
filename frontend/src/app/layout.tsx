import '@/styles/index.css';

import type { Metadata } from 'next';

import { AnalyticsScripts } from './analytics-scripts';
import { Providers } from './providers';

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
        <AnalyticsScripts />
      </body>
    </html>
  );
}
