import { cp } from 'node:fs/promises'
import { defineConfig } from 'tsup'

export default defineConfig({
  // server.js runs the api, migrate.js runs before it in the image, and
  // seed.js loads the demo data by hand
  entry: ['src/server.ts', 'src/migrate.ts', 'src/seed.ts'],
  format: ['esm'],
  target: 'node24',
  clean: true,
  // The workspace packages ship TypeScript source, so they go into the
  // bundle. Their own npm dependencies (drizzle-orm, pg, zod) stay external.
  noExternal: [/^@salary\//],
  onSuccess: async () => {
    await cp('../../packages/db/migrations', 'dist/migrations', { recursive: true })
  },
})
