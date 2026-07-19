import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ReportSharePayload } from '@/lib/share/codec';
import {
  buildReportShareMetadata,
  resolveReportShareMetadataBase,
} from '@/lib/share/metadata';
import {
  buildReportShareMetadataContent,
  isCurrentMonthAtIssue,
} from '@/lib/share/presentation';

import { buildAnalysis } from './insight-test-utils';

const buildPayload = (): ReportSharePayload => {
  const analysis = buildAnalysis({
    items: [
      { categoryIndex: 6, mySpentAmount: '300000', averageSpentAmount: '0' },
      { categoryIndex: 2, mySpentAmount: '500000', averageSpentAmount: '0' },
      { categoryIndex: 9, mySpentAmount: '900000', averageSpentAmount: '0' },
    ],
  });

  return {
    v: 1,
    year: 2026,
    month: 7,
    currencyType: 'BASE',
    localCountryCode: 'DE',
    baseCountryCode: 'KR',
    issuedAt: '2026-07-19T00:00:00.000Z',
    analysis: {
      ...analysis,
      compareWithLastMonth: {
        ...analysis.compareWithLastMonth,
        totalSpent: {
          ...analysis.compareWithLastMonth.totalSpent,
          thisMonthToDate: '1234500',
        },
      },
    },
  };
};

describe('Report share presentation', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('발급 시각의 UTC 연월과 리포트 연월이 같으면 현재 월로 판정한다', () => {
    expect(isCurrentMonthAtIssue('2026-07-31T23:59:59.000Z', 2026, 7)).toBe(
      true,
    );
    expect(isCurrentMonthAtIssue('2026-08-01T00:00:00.000Z', 2026, 7)).toBe(
      false,
    );
    expect(isCurrentMonthAtIssue('invalid-date', 2026, 7)).toBe(false);
  });

  it('총지출과 수입을 제외한 최다 지출 카테고리로 메타데이터를 만든다', () => {
    expect(buildReportShareMetadataContent(buildPayload())).toEqual({
      title: '7월 지출 리포트',
      description:
        '2026년 7월 총지출은 1,234,500원이에요. 가장 많이 지출한 카테고리는 식비예요.',
    });
  });

  it('SITE_URL이 없거나 잘못된 개발 환경에서는 localhost를 사용한다', () => {
    expect(resolveReportShareMetadataBase(undefined, 'development')?.href).toBe(
      'http://localhost:5173/',
    );
    expect(
      resolveReportShareMetadataBase('not-a-url', 'development')?.href,
    ).toBe('http://localhost:5173/');
  });

  it('유효한 HTTP(S) SITE_URL을 환경과 무관하게 우선 사용한다', () => {
    expect(
      resolveReportShareMetadataBase('https://example.com', 'production')?.href,
    ).toBe('https://example.com/');
    expect(
      resolveReportShareMetadataBase('ftp://example.com', 'production'),
    ).toBeUndefined();
  });

  it('프로덕션에서 SITE_URL이 없어도 메타데이터 본문을 생성한다', () => {
    vi.stubEnv('SITE_URL', '');
    vi.stubEnv('NODE_ENV', 'production');

    const metadata = buildReportShareMetadata(
      buildReportShareMetadataContent(buildPayload()),
    );

    expect(metadata.metadataBase).toBeUndefined();
    expect(metadata.openGraph).not.toHaveProperty('images');
    expect(metadata).toMatchObject({
      title: '7월 지출 리포트',
      robots: { index: false, follow: false },
      openGraph: { title: '7월 지출 리포트' },
    });
  });
});
