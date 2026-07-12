export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN ?? '';
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';
export const CONTENTSQUARE_KEY =
  process.env.NEXT_PUBLIC_CONTENTSQUARE_KEY ?? '';
export const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN ?? '';
export const DEV_USER_ID = process.env.NEXT_PUBLIC_DEV_USER_ID ?? '';
export const IS_PROD = process.env.NODE_ENV === 'production';
export const APP_ENV = process.env.NODE_ENV;
