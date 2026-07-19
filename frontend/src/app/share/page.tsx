import type { Metadata } from 'next';
import Link from 'next/link';

import ShareReportView from '@/components/report-page/ShareReportView';

import { Icons } from '@/assets';
import { buildReportShareMetadata } from '@/lib/share/metadata';
import {
  buildReportShareMetadataContent,
  type ReportShareMetadataContent,
} from '@/lib/share/presentation';
import {
  type ReportShareTokenVerification,
  verifyReportShareToken,
} from '@/lib/share/token';

type SharePageSearchParams = Promise<{
  d?: string | string[];
}>;

interface SharePageProps {
  searchParams: SharePageSearchParams;
}

const DEFAULT_METADATA: ReportShareMetadataContent = {
  title: '공유된 지출 리포트',
  description: '유니포켓에서 공유된 월간 지출 리포트입니다.',
};

export async function generateMetadata({
  searchParams,
}: SharePageProps): Promise<Metadata> {
  const { d } = await searchParams;
  const verification = await verifyReportShareToken(d);
  const content =
    verification.status === 'valid'
      ? buildReportShareMetadataContent(verification.payload)
      : DEFAULT_METADATA;

  return buildReportShareMetadata(content);
}

const SharePageHeader = () => (
  <header className="border-line-normal-alternative bg-background-normal flex h-16 items-center border-b px-8">
    <Link href="/" aria-label="유니포켓 홈으로 이동">
      <Icons.LogoText className="h-8 w-32" />
    </Link>
  </header>
);

const LandingLink = ({ children }: { children: React.ReactNode }) => (
  <Link
    href="/"
    className="body2-normal-bold rounded-modal-10 bg-primary-normal hover:bg-primary-strong text-inverse-label inline-flex h-10 items-center justify-center px-5 transition-colors"
  >
    {children}
  </Link>
);

const ShareLinkError = ({
  status,
}: {
  status: Exclude<ReportShareTokenVerification['status'], 'valid'>;
}) => {
  const isExpired = status === 'expired';

  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <section className="rounded-modal-20 bg-background-normal shadow-semantic-subtle flex w-full max-w-120 flex-col items-center gap-6 px-10 py-14 text-center">
        <div className="bg-teal-99 flex h-16 w-16 items-center justify-center rounded-full">
          <Icons.Logo className="h-10 w-10" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="title3-bold text-label-normal">
            {isExpired ? '만료된 링크예요' : '유효하지 않은 링크예요'}
          </h1>
          <p className="body2-normal-medium text-label-alternative">
            {isExpired
              ? '공유 기간이 지나 이 리포트를 더 이상 볼 수 없어요.'
              : '링크가 올바르지 않거나 일부가 변경되었어요.'}
          </p>
        </div>
        <LandingLink>유니포켓 둘러보기</LandingLink>
      </section>
    </main>
  );
};

export default async function SharePage({ searchParams }: SharePageProps) {
  const { d } = await searchParams;
  const verification = await verifyReportShareToken(d);

  return (
    <div className="bg-background-alternative min-h-screen">
      <SharePageHeader />
      {verification.status === 'valid' ? (
        <main className="flex flex-col items-center gap-8 overflow-x-auto px-8 py-10">
          <section className="flex min-w-283 flex-col gap-2">
            <h1 className="title2-bold text-label-normal">
              {verification.payload.year}년 {verification.payload.month}월
              리포트
            </h1>
            <p className="body2-normal-medium text-label-alternative">
              공유된 시점의 소비 데이터를 담은 스냅샷이에요.
            </p>
          </section>
          <ShareReportView payload={verification.payload} />
          <section className="border-line-normal-alternative flex min-w-283 items-center justify-between border-t py-8">
            <div className="flex flex-col gap-1">
              <p className="headline1-bold text-label-normal">
                교환학생 지출, 유니포켓으로 한눈에 관리하세요
              </p>
              <p className="body2-normal-medium text-label-alternative">
                여러 통화의 카드와 현금 지출을 한 가계부에서 관리할 수 있어요.
              </p>
            </div>
            <LandingLink>유니포켓 시작하기</LandingLink>
          </section>
        </main>
      ) : (
        <ShareLinkError status={verification.status} />
      )}
    </div>
  );
}
