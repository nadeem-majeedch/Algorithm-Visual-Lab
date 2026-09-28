import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

// Inherits `base` and plugins from vite.config.ts so unit tests run against
// the exact module graph the production build uses.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        include: ['src/**'],
        // Presentation, entry points, and pure type modules are exercised by
        // e2e tests rather than unit tests.
        exclude: ['src/tests/**', 'src/main.tsx', 'src/**/types.ts'],
        thresholds: {
          lines: 70,
          functions: 70,
          branches: 60,
          statements: 70,
        },
      },
    },
  }),
)
