import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 85,
        branches: 85,
      },
      include: ['src/**'],
      exclude: ['src/index.ts'],
    },
  },
});
