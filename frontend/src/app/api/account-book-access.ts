import 'server-only';

import { NextResponse } from 'next/server';

import type { GetAccountBookAmountResponse } from '@/api/account-books/type';

type AccessVerification =
  | {
      ok: true;
      localCountryCode: string | null;
      baseCountryCode: string | null;
    }
  | { ok: false; response: Response };

const readCountryCode = (
  data: Partial<GetAccountBookAmountResponse> | null,
  key: 'localCountryCode' | 'baseCountryCode',
): string | null => (typeof data?.[key] === 'string' ? data[key] : null);

export const verifyAccountBookAccess = async (
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
    const data = (await response
      .json()
      .catch(() => null)) as Partial<GetAccountBookAmountResponse> | null;

    return {
      ok: true,
      localCountryCode: readCountryCode(data, 'localCountryCode'),
      baseCountryCode: readCountryCode(data, 'baseCountryCode'),
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
