import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  casing: 'snake_case',
  dbCredentials: {
    // only db:migrate needs a database, db:generate works offline
    url: process.env.DATABASE_URL ?? '',
  },
})
