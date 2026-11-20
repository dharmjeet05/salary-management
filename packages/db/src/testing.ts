import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import type { Database } from './database'
import * as schema from './schema'

const migrationsFolder = fileURLToPath(new URL('../migrations', import.meta.url))

export async function createTestDb() {
  const client = new PGlite()
  const db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder })
  return { db, close: () => client.close() }
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>

export async function resetDb(db: Database) {
  await db.execute(sql`truncate table ${schema.employees} restart identity`)
}
