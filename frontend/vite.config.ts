/// <reference types="vitest" />
import { sentryVitePlugin } from '@sentry/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';
import svgr from 'vite-plugin-svgr';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // 호스트네임 추출 (예: https://api.unipocket.co.kr -> api.unipocket.co.kr)
  const targetUrl = new URL(env.VITE_API_PROXY_TARGET || 'http://localhost');
  const targetHostname = targetUrl.hostname;
  // 서버 쿠키 도메인 형식에 맞춰 변환 (api.unipocket.co.kr -> .unipocket.co.kr)
  const cookieDomain = targetHostname.replace(/^api\./, '.');
  return {
    base: '/',
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
      svgr({
        svgrOptions: {
          icon: true,
        },
        include: '**/*.svg',
      }),
      ...(mode === 'production'
        ? [
            sentryVitePlugin({
              authToken: env.SENTRY_AUTH_TOKEN,
              org: env.SENTRY_ORG,
              project: env.SENTRY_PROJECT,
              sourcemaps: {
                filesToDeleteAfterUpload: ['./dist/**/*.map'],
              },
            }),
          ]
        : []),
    ],
    build: {
      sourcemap: mode === 'production' ? 'hidden' : false,
    },
    resolve: {
      alias: [{ find: '@', replacement: '/src' }],
    },
    test: {
      globals: true,
      environment: 'node',
      alias: [{ find: '@', replacement: '/src' }],
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          cookieDomainRewrite: {
            [cookieDomain]: 'localhost',
          },
        },
        '/cdn-assets': {
          target: 'https://storage.googleapis.com/unipocket-cdn-5ba3282c',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/cdn-assets/, ''),
        },
      },
    },
  };
});
