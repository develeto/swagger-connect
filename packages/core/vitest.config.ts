import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 90,
        branches: 90,
      },
      include: ['src/**'],
      exclude: ['src/index.ts', 'src/types/**', 'src/adapters/**'],
    },
  },
});
