import 'server-only';

import {
  decodeReportSharePayload,
  encodeReportSharePayload,
  parseReportSharePayload,
  type ReportSharePayload,
} from './codec';
import { signReportSharePayload, verifyReportShareSignature } from './sign';

export const REPORT_SHARE_TOKEN_MAX_LENGTH = 8_192;
export const REPORT_SHARE_TTL_MS = 90 * 24 * 60 * 60 * 1_000;

export class ReportShareTokenTooLongError extends Error {
  constructor() {
    super('Report share token exceeds maximum length');
    this.name = 'ReportShareTokenTooLongError';
  }
}

export type ReportShareTokenVerification =
  | { status: 'valid'; payload: ReportSharePayload }
  | { status: 'expired' }
  | { status: 'invalid' };

export const createReportShareToken = async (
  payload: ReportSharePayload,
): Promise<string> => {
  const encodedPayload = encodeReportSharePayload(payload);
  const signature = await signReportSharePayload(encodedPayload);
  const token = `${encodedPayload}.${signature}`;
  if (token.length > REPORT_SHARE_TOKEN_MAX_LENGTH) {
    throw new ReportShareTokenTooLongError();
  }
  return token;
};

export const verifyReportShareToken = async (
  token: unknown,
  now = new Date(),
): Promise<ReportShareTokenVerification> => {
  if (typeof token !== 'string' || token.length > REPORT_SHARE_TOKEN_MAX_LENGTH)
    return { status: 'invalid' };

  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { status: 'invalid' };
  }
  const [encodedPayload, signature] = parts;
  if (!(await verifyReportShareSignature(encodedPayload, signature))) {
    return { status: 'invalid' };
  }

  let decoded: unknown;
  try {
    decoded = decodeReportSharePayload(encodedPayload);
  } catch {
    return { status: 'invalid' };
  }

  const payload = parseReportSharePayload(decoded);
  if (!payload) return { status: 'invalid' };

  const issuedAt = Date.parse(payload.issuedAt);
  if (!Number.isFinite(issuedAt) || issuedAt > now.getTime()) {
    return { status: 'invalid' };
  }
  if (issuedAt + REPORT_SHARE_TTL_MS <= now.getTime()) {
    return { status: 'expired' };
  }

  return { status: 'valid', payload };
};
