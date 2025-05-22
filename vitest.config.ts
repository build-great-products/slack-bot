import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      reporter: ['html', 'text', 'json-summary', 'json'],
      reportOnFailure: true,
    },
  },
})
