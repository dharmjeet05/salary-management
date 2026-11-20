import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import type { Database } from './database'
import * as schema from './schema'

export function createDb(connectionString: string): { db: Database; close: () => Promise<void> } {
  const pool = new Pool({ connectionString })
  const db = drizzle(pool, { schema })
  return { db, close: () => pool.end() }
}
