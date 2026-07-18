import 'server-only';

const SIGNATURE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const encoder = new TextEncoder();

const getSigningKey = async (): Promise<CryptoKey> => {
  const secret = process.env.SHARE_LINK_SECRET;
  if (!secret) throw new Error('SHARE_LINK_SECRET is not configured');

  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
};

export const signReportSharePayload = async (
  encodedPayload: string,
): Promise<string> => {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(encodedPayload),
  );

  return Buffer.from(signature).toString('base64url');
};

export const verifyReportShareSignature = async (
  encodedPayload: string,
  signature: string,
): Promise<boolean> => {
  if (!SIGNATURE_PATTERN.test(signature)) return false;

  try {
    const key = await getSigningKey();
    return crypto.subtle.verify(
      'HMAC',
      key,
      Buffer.from(signature, 'base64url'),
      encoder.encode(encodedPayload),
    );
  } catch {
    return false;
  }
};
