import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GeminiRequestError } from '@/app/api/insights/summary/gemini';

const cacheMocks = vi.hoisted(() => ({
  getCurrentInsightSummary: vi.fn(),
  getPastInsightSummary: vi.fn(),
}));

vi.mock('@/app/api/insights/summary/cache', () => cacheMocks);

import { POST } from '@/app/api/insights/summary/route';

const buildBody = (ruleId = 'weekly-trend') => ({
  accountBookId: 5,
  year: 2020,
  month: 7,
  currencyType: 'BASE',
  facts: [{ ruleId, severity: 'warning', params: { pct: 41 } }],
});

const buildRequest = (body = buildBody(), withCookie = true) =>
  new Request('http://localhost/api/insights/summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(withCookie ? { Cookie: 'accessToken=test' } : {}),
    },
    body: JSON.stringify(body),
  });

describe('POST /api/insights/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('API_PROXY_TARGET', 'http://backend/api');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"localCountryCode":"KR"}')),
    );
  });

  it('쿠키가 없으면 소유권 확인 전에 401을 반환한다', async () => {
    const response = await POST(buildRequest(buildBody(), false));

    expect(response.status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('소유하지 않은 가계부의 404 응답은 403으로 매핑한다', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 404 }));

    const response = await POST(buildRequest());

    expect(response.status).toBe(403);
    expect(cacheMocks.getPastInsightSummary).not.toHaveBeenCalled();
  });

  it('fallback만 전달되면 Gemini 캐시 함수를 호출하지 않는다', async () => {
    const response = await POST(buildRequest(buildBody('starter-fallback')));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      summary: null,
      generatedAt: null,
      cached: false,
    });
    expect(fetch).toHaveBeenCalledWith(
      'http://backend/api/account-books/5/amount',
      expect.objectContaining({
        headers: { cookie: 'accessToken=test' },
      }),
    );
    expect(cacheMocks.getPastInsightSummary).not.toHaveBeenCalled();
  });

  it('과거 달 캐시 결과를 cached true로 반환한다', async () => {
    cacheMocks.getPastInsightSummary.mockResolvedValueOnce({
      summary: '요약입니다.',
      generatedAt: '2026-07-12T00:00:00.000Z',
      generationId: 'previous-request',
    });

    const response = await POST(buildRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      summary: '요약입니다.',
      cached: true,
    });
  });

  it('캐시 미스에서 Gemini 429가 발생하면 요약 생략 응답을 반환한다', async () => {
    cacheMocks.getPastInsightSummary.mockRejectedValueOnce(
      new GeminiRequestError(429),
    );

    const response = await POST(buildRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      summary: null,
      generatedAt: null,
      cached: false,
    });
  });
});
