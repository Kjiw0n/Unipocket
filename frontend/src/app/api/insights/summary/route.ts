import { NextResponse } from 'next/server';

import type { GetInsightSummaryResponse } from '@/api/insights/type';
import { COUNTRY_TIME_REGION, TIME_REGION_CONFIG } from '@/constants/time';
import type { CountryCode } from '@/data/country/countryCode';
import { compareYearMonth, getCurrentYearMonth } from '@/lib/insight/time';

import { verifyAccountBookAccess } from '../../account-book-access';
import { getCurrentInsightSummary, getPastInsightSummary } from './cache';
import { GeminiRequestError } from './gemini';
import { hasMeaningfulFacts, parseInsightSummaryRequest } from './validation';

const omittedSummary = (): GetInsightSummaryResponse => ({
  summary: null,
  generatedAt: null,
  cached: false,
});

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
