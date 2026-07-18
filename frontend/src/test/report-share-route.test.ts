import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/share/report/route';
import { verifyReportShareToken } from '@/lib/share/token';

import { buildAnalysis } from './insight-test-utils';

const buildBody = () => ({
  accountBookId: 5,
  year: 2026,
  month: 7,
  currencyType: 'BASE',
});

const buildRequest = (
  body: unknown = buildBody(),
  withCookie = true,
): Request =>
  new Request('http://localhost/api/share/report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(withCookie ? { Cookie: 'access_token=test' } : {}),
    },
    body: JSON.stringify(body),
  });

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('POST /api/share/report', () => {
  beforeEach(() => {
    vi.stubEnv('API_PROXY_TARGET', 'http://backend/api');
    vi.stubEnv('SHARE_LINK_SECRET', 'test-share-link-secret');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('요청 본문 형식이 잘못되면 400을 반환한다', async () => {
    const response = await POST(
      buildRequest({ ...buildBody(), currencyType: 'USD' }),
    );

    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('쿠키가 없으면 소유권 확인 전에 401을 반환한다', async () => {
    const response = await POST(buildRequest(buildBody(), false));

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('소유하지 않은 가계부의 404 응답을 403으로 매핑한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, 404));

    const response = await POST(buildRequest());

    expect(response.status).toBe(403);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('BE에서 직접 조회한 집계만 서명해 상대 경로를 반환한다', async () => {
    const analysis = buildAnalysis();
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({ localCountryCode: 'DE', baseCountryCode: 'KR' }),
      )
      .mockResolvedValueOnce(jsonResponse(analysis));

    const response = await POST(
      buildRequest({
        ...buildBody(),
        analysis: { merchantName: '클라이언트가 보낸 값' },
      }),
    );
    const result = (await response.json()) as { url: string };
    const token = result.url.slice('/share?d='.length);
    const verification = await verifyReportShareToken(token);

    expect(response.status).toBe(200);
    expect(result.url).toMatch(/^\/share\?d=[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'http://backend/api/account-books/5/amount',
      expect.objectContaining({ headers: { cookie: 'access_token=test' } }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'http://backend/api/account-books/5/analysis?year=2026&month=7&currencyType=BASE',
      expect.objectContaining({
        headers: { cookie: 'access_token=test' },
        cache: 'no-store',
      }),
    );
    expect(verification.status).toBe('valid');
    if (verification.status === 'valid') {
      expect(verification.payload.analysis).toEqual(analysis);
      expect(verification.payload).not.toHaveProperty('merchantName');
    }
  });

  it('BE 분석 응답 스키마가 잘못되면 토큰을 발급하지 않는다', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({ localCountryCode: 'DE', baseCountryCode: 'KR' }),
      )
      .mockResolvedValueOnce(jsonResponse({ merchantName: '개별 지출' }));

    const response = await POST(buildRequest());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      message: '리포트 데이터 형식이 올바르지 않습니다.',
    });
  });
});
