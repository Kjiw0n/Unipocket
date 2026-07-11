interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_CDN_URL: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_GA_MEASUREMENT_ID: string;
  readonly VITE_CONTENTSQUARE_KEY: string;
  readonly VITE_COOKIE_DOMAIN: string;
  readonly VITE_USER_ID: string;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
