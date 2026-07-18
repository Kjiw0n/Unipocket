import { NextResponse } from 'next/server';

import { parseReportSharePayload } from '@/lib/share/codec';
import { createReportShareToken } from '@/lib/share/token';

import { verifyAccountBookAccess } from '../../account-book-access';
import { parseShareReportRequest } from './validation';

const serverConfigurationError = () =>
  NextResponse.json({ message: '서버 설정을 확인해주세요.' }, { status: 500 });

const analysisRequestError = (status: number) => {
  if (status === 401) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 },
    );
  }
  if (status === 403 || status === 404) {
    return NextResponse.json(
      { message: '가계부에 접근할 권한이 없습니다.' },
      { status: 403 },
    );
  }
  return NextResponse.json(
    { message: '리포트 데이터를 불러오지 못했습니다.' },
    { status: 502 },
  );
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseShareReportRequest(body);
  if (!parsed) {
    return NextResponse.json(
      { message: '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const access = await verifyAccountBookAccess(request, parsed.accountBookId);
  if (!access.ok) return access.response;

  const cookie = request.headers.get('cookie');
  const backendUrl = process.env.API_PROXY_TARGET?.replace(/\/$/, '');
  if (!cookie || !backendUrl) return serverConfigurationError();

  const params = new URLSearchParams({
    year: String(parsed.year),
    month: String(parsed.month),
    currencyType: parsed.currencyType,
  });
  let response: Response;
  try {
    response = await fetch(
      `${backendUrl}/account-books/${parsed.accountBookId}/analysis?${params}`,
      {
        headers: { cookie },
        cache: 'no-store',
        signal: AbortSignal.timeout(10_000),
      },
    );
  } catch {
    return analysisRequestError(502);
  }
  if (!response.ok) return analysisRequestError(response.status);

  const analysis = await response.json().catch(() => null);
  const payload = parseReportSharePayload({
    v: 1,
    year: parsed.year,
    month: parsed.month,
    currencyType: parsed.currencyType,
    localCountryCode: access.localCountryCode,
    baseCountryCode: access.baseCountryCode,
    issuedAt: new Date().toISOString(),
    analysis,
  });
  if (!payload) {
    return NextResponse.json(
      { message: '리포트 데이터 형식이 올바르지 않습니다.' },
      { status: 502 },
    );
  }

  try {
    const token = await createReportShareToken(payload);
    return NextResponse.json({ url: `/share?d=${token}` });
  } catch {
    return serverConfigurationError();
  }
}
