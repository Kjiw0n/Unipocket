import { NextResponse } from 'next/server';

import type { GetInsightSummaryResponse } from '@/api/insights/type';
import { COUNTRY_TIME_REGION, TIME_REGION_CONFIG } from '@/constants/time';
import type { CountryCode } from '@/data/country/countryCode';

import { getCurrentInsightSummary, getPastInsightSummary } from './cache';
import { GeminiRequestError } from './gemini';
import {
  compareYearMonth,
  getCurrentYearMonth,
  hasMeaningfulFacts,
  parseInsightSummaryRequest,
} from './validation';

const omittedSummary = (): GetInsightSummaryResponse => ({
  summary: null,
  generatedAt: null,
  cached: false,
});

type AccessVerification =
  | { ok: true; localCountryCode: string | null }
  | { ok: false; response: Response };

const verifyAccountBookAccess = async (
  request: Request,
  accountBookId: number,
): Promise<AccessVerification> => {
  const cookie = request.headers.get('cookie');
  if (!cookie) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 },
      ),
    };
  }

  const backendUrl = process.env.API_PROXY_TARGET?.replace(/\/$/, '');
  if (!backendUrl) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: '서버 설정을 확인해주세요.' },
        { status: 500 },
      ),
    };
  }

  let response: Response;
  try {
    response = await fetch(
      `${backendUrl}/account-books/${accountBookId}/amount`,
      {
        headers: { cookie },
        cache: 'no-store',
        signal: AbortSignal.timeout(5_000),
      },
    );
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { message: '가계부 접근 권한을 확인하지 못했습니다.' },
        { status: 502 },
      ),
    };
  }

  if (response.ok) {
    const data = (await response.json().catch(() => null)) as {
      localCountryCode?: unknown;
    } | null;
    return {
      ok: true,
      localCountryCode:
        typeof data?.localCountryCode === 'string'
          ? data.localCountryCode
          : null,
    };
  }
  if (response.status === 401) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: '로그인이 필요합니다.' },
        { status: 401 },
      ),
    };
  }
  if (response.status === 403 || response.status === 404) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: '가계부에 접근할 권한이 없습니다.' },
        { status: 403 },
      ),
    };
  }
  return {
    ok: false,
    response: NextResponse.json(
      { message: '가계부 접근 권한을 확인하지 못했습니다.' },
      { status: 502 },
    ),
  };
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = parseInsightSummaryRequest(body);
  if (!parsed) {
    return NextResponse.json(
      { message: '요청 형식이 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  const access = await verifyAccountBookAccess(request, parsed.accountBookId);
  if (!access.ok) return access.response;

  const timeRegion = access.localCountryCode
    ? COUNTRY_TIME_REGION[access.localCountryCode as CountryCode]
    : undefined;
  const timeZone = TIME_REGION_CONFIG[timeRegion ?? 'DEFAULT'].timeZone;
  const monthComparison = compareYearMonth(
    parsed,
    getCurrentYearMonth(new Date(), timeZone),
  );
  if (monthComparison > 0) {
    return NextResponse.json(
      { message: '미래 월의 요약은 생성할 수 없습니다.' },
      { status: 400 },
    );
  }

  if (!hasMeaningfulFacts(parsed.facts)) {
    return NextResponse.json(omittedSummary());
  }

  const generationId = crypto.randomUUID();
  try {
    const result =
      monthComparison === 0
        ? await getCurrentInsightSummary(parsed, generationId)
        : await getPastInsightSummary(parsed, generationId);
    return NextResponse.json<GetInsightSummaryResponse>({
      summary: result.summary,
      generatedAt: result.generatedAt,
      cached: result.generationId !== generationId,
    });
  } catch (error) {
    if (error instanceof GeminiRequestError && error.status === 429) {
      return NextResponse.json(omittedSummary());
    }
    const status =
      error instanceof GeminiRequestError && error.status === 408 ? 504 : 502;
    return NextResponse.json(
      { message: 'AI 소비 요약을 생성하지 못했습니다.' },
      { status },
    );
  }
}
