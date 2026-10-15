import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['tests/globalSetup.ts'],
    setupFiles: ['tests/setupEnv.ts'],
    // Los tests comparten una base real de Postgres: en serie para que no se pisen.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 60000,
  },
});
