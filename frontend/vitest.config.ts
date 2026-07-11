import { fileURLToPath, URL } from 'node:url';

import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(() => {
  const env = loadEnv('development', process.cwd(), '');

  return {
    test: {
      globals: true,
      environment: 'node',
      env,
      alias: [
        {
          find: '@',
          replacement: fileURLToPath(new URL('./src', import.meta.url)),
        },
      ],
    },
  };
});
