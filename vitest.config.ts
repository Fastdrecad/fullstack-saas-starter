import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    setupFiles: ['./vitest.setup.ts'],
    fileParallelism: false,
    include: ['apps/**/*.test.{ts,tsx}', 'packages/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules/', 'dist/', '**/*.test.{ts,tsx}', '**/types/', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@api': path.resolve(__dirname, 'apps/api/src'),
      '@web': path.resolve(__dirname, 'apps/web/src'),
      '@shared': path.resolve(__dirname, 'packages/shared/src'),
      '@starter/shared': path.resolve(__dirname, 'packages/shared/src'),
    },
  },
})
