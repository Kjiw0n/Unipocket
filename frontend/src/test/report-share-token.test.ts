import { compressToUint8Array } from 'lz-string';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  decodeReportSharePayload,
  encodeReportSharePayload,
  parseReportSharePayload,
  type ReportSharePayload,
} from '@/lib/share/codec';
import { signReportSharePayload } from '@/lib/share/sign';
import {
  createReportShareToken,
  REPORT_SHARE_TOKEN_MAX_LENGTH,
  REPORT_SHARE_TTL_MS,
  verifyReportShareToken,
} from '@/lib/share/token';

import { buildAnalysis } from './insight-test-utils';

const NOW = new Date('2026-07-18T00:00:00.000Z');

const buildPayload = (
  overrides: Partial<ReportSharePayload> = {},
): ReportSharePayload => ({
  v: 1,
  year: 2026,
  month: 7,
  currencyType: 'BASE',
  localCountryCode: 'DE',
  baseCountryCode: 'KR',
  issuedAt: NOW.toISOString(),
  analysis: buildAnalysis(),
  ...overrides,
});

const encodeText = (value: string): string =>
  Buffer.from(compressToUint8Array(value)).toString('base64url');

const signEncoded = async (encoded: string): Promise<string> =>
  `${encoded}.${await signReportSharePayload(encoded)}`;

describe('Report share token', () => {
  beforeEach(() => {
    vi.stubEnv('SHARE_LINK_SECRET', 'test-share-link-secret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('페이로드를 압축 base64url로 왕복 직렬화한다', () => {
    const payload = buildPayload();
    const encoded = encodeReportSharePayload(payload);

    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(parseReportSharePayload(decodeReportSharePayload(encoded))).toEqual(
      payload,
    );
  });

  it('서명된 정상 토큰을 검증한다', async () => {
    const payload = buildPayload();
    const token = await createReportShareToken(payload);

    await expect(verifyReportShareToken(token, NOW)).resolves.toEqual({
      status: 'valid',
      payload,
    });
  });

  it('단일 문자열이 아닌 토큰을 거부한다', async () => {
    await expect(verifyReportShareToken(undefined, NOW)).resolves.toEqual({
      status: 'invalid',
    });
    await expect(verifyReportShareToken(['token'], NOW)).resolves.toEqual({
      status: 'invalid',
    });
  });

  it('8,192자 길이 상한을 초과한 토큰을 거부한다', async () => {
    await expect(
      verifyReportShareToken(
        'a'.repeat(REPORT_SHARE_TOKEN_MAX_LENGTH + 1),
        NOW,
      ),
    ).resolves.toEqual({ status: 'invalid' });
  });

  it('점으로 정확히 두 조각이 아닌 토큰을 거부한다', async () => {
    await expect(verifyReportShareToken('payload', NOW)).resolves.toEqual({
      status: 'invalid',
    });
    await expect(
      verifyReportShareToken('payload.signature.extra', NOW),
    ).resolves.toEqual({ status: 'invalid' });
  });

  it('페이로드 한 글자 변조 시 HMAC 검증에 실패한다', async () => {
    const token = await createReportShareToken(buildPayload());
    const [encoded, signature] = token.split('.') as [string, string];
    const tampered = `${encoded[0] === 'A' ? 'B' : 'A'}${encoded.slice(1)}`;

    await expect(
      verifyReportShareToken(`${tampered}.${signature}`, NOW),
    ).resolves.toEqual({ status: 'invalid' });
  });

  it('서명은 유효하지만 JSON이 아닌 페이로드를 거부한다', async () => {
    const encoded = encodeText('not-json');

    await expect(
      verifyReportShareToken(await signEncoded(encoded), NOW),
    ).resolves.toEqual({ status: 'invalid' });
  });

  it('서명은 유효하지만 스키마가 잘못된 페이로드를 거부한다', async () => {
    const encoded = encodeText(JSON.stringify({ v: 1 }));

    await expect(
      verifyReportShareToken(await signEncoded(encoded), NOW),
    ).resolves.toEqual({ status: 'invalid' });
  });

  it('발급 후 90일이 지난 토큰을 만료로 구분한다', async () => {
    const issuedAt = new Date(NOW.getTime() - REPORT_SHARE_TTL_MS - 1);
    const token = await createReportShareToken(
      buildPayload({ issuedAt: issuedAt.toISOString() }),
    );

    await expect(verifyReportShareToken(token, NOW)).resolves.toEqual({
      status: 'expired',
    });
  });

  it('발급 시각이 미래인 토큰을 거부한다', async () => {
    const token = await createReportShareToken(
      buildPayload({ issuedAt: new Date(NOW.getTime() + 1).toISOString() }),
    );

    await expect(verifyReportShareToken(token, NOW)).resolves.toEqual({
      status: 'invalid',
    });
  });

  it('스키마 파싱 시 허용하지 않은 필드를 페이로드에서 제거한다', () => {
    const parsed = parseReportSharePayload({
      ...buildPayload(),
      merchantName: '포함되면 안 되는 개별 지출 정보',
      analysis: {
        ...buildAnalysis(),
        expenseRecords: [{ merchantName: '상점', amount: 1000 }],
      },
    });

    expect(parsed).not.toHaveProperty('merchantName');
    expect(parsed?.analysis).not.toHaveProperty('expenseRecords');
  });
});
