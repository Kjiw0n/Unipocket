import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const API_PROXY_TARGET = process.env.API_PROXY_TARGET;
const CDN_PROXY_TARGET = process.env.CDN_PROXY_TARGET;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    disableStaticImages: true,
  },
  async rewrites() {
    return {
      afterFiles: [
        {
          source: '/api/:path*',
          destination: `${API_PROXY_TARGET}/:path*`,
        },
        {
          source: '/cdn-assets/:path*',
          destination: `${CDN_PROXY_TARGET}/:path*`,
        },
      ],
    };
  },
  turbopack: {
    rules: {
      '*.svg': {
        loaders: [{ loader: '@svgr/webpack', options: { icon: true } }],
        as: '*.js',
      },
    },
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
});
