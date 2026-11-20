import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import type * as schema from './schema'

// Both the pg client and the PGlite test client fit this type,
// so repositories work the same against either.
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>
