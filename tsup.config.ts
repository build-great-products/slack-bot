import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/migrations/*.ts'],
  format: ['esm'],
  clean: true,
  target: 'node22',
})
