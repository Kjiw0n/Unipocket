import 'server-only';

import type { Metadata } from 'next';

import type { ReportShareMetadataContent } from '@/lib/share/presentation';

const DEVELOPMENT_SITE_URL = 'http://localhost:5173';
const OG_IMAGE_PATH = '/report-share-og.png';

const parseHttpUrl = (value: string | undefined): URL | undefined => {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url
      : undefined;
  } catch {
    return undefined;
  }
};

export const resolveReportShareMetadataBase = (
  siteUrl: string | undefined,
  nodeEnv: string | undefined,
): URL | undefined =>
  parseHttpUrl(siteUrl) ??
  (nodeEnv === 'development' ? new URL(DEVELOPMENT_SITE_URL) : undefined);

export const buildReportShareMetadata = (
  content: ReportShareMetadataContent,
): Metadata => {
  const metadataBase = resolveReportShareMetadataBase(
    process.env.SITE_URL,
    process.env.NODE_ENV,
  );

  return {
    ...(metadataBase ? { metadataBase } : {}),
    title: content.title,
    description: content.description,
    robots: { index: false, follow: false },
    openGraph: {
      type: 'website',
      siteName: 'Unipocket',
      title: content.title,
      description: content.description,
      ...(metadataBase
        ? {
            images: [
              {
                url: OG_IMAGE_PATH,
                width: 1200,
                height: 630,
                alt: '유니포켓 공유 리포트',
              },
            ],
          }
        : {}),
    },
  };
};
