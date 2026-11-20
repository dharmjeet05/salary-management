import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import type { Database } from './database'
import * as schema from './schema'

export function createDb(connectionString: string): { db: Database; close: () => Promise<void> } {
  const pool = new Pool({ connectionString })
  // An idle connection that drops (for example when postgres restarts) emits
  // 'error' on the pool. Without a listener node throws and the API dies.
  pool.on('error', (error) => {
    console.error('postgres pool error', error)
  })
  const db = drizzle(pool, { schema })
  return { db, close: () => pool.end() }
}
