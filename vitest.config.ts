import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/game/**', 'src/stores/**', 'src/composables/**'],
      thresholds: { lines: 90, functions: 90, branches: 85 },
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
})
