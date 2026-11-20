import { createDb } from '@salary/db'
import { createApp } from './app'
import { loadEnv } from './config/env'
import { startServer } from './start-server'

const env = loadEnv()
const { db } = createDb(env.databaseUrl)
await startServer(createApp({ corsOrigin: env.corsOrigin, db }), env.port)
console.log(`API listening on http://localhost:${String(env.port)}`)
