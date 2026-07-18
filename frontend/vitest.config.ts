import { fileURLToPath, URL } from 'node:url';

import { loadEnv } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig(() => {
  const env = loadEnv('development', process.cwd(), '');

  return {
    test: {
      globals: true,
      environment: 'node',
      env,
      exclude: [...configDefaults.exclude, 'e2e/**'],
      alias: [
        {
          find: 'server-only',
          replacement: fileURLToPath(
            new URL('./node_modules/server-only/empty.js', import.meta.url),
          ),
        },
        {
          find: '@',
          replacement: fileURLToPath(new URL('./src', import.meta.url)),
        },
      ],
    },
  };
});
