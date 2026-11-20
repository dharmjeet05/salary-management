import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node24',
  clean: true,
  // The workspace packages ship TypeScript source, so they go into the
  // bundle. Their own npm dependencies (drizzle-orm, pg, zod) stay external.
  noExternal: [/^@salary\//],
})
