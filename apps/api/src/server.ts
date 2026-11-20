import { createDb } from '@salary/db'
import { createApp } from './app'
import { loadEnv } from './config/env'
import { startServer, stopServer } from './start-server'

const env = loadEnv()
const { db, close } = createDb(env.databaseUrl)
const server = await startServer(
  createApp({ corsOrigin: env.corsOrigin, db, buildTag: env.buildTag }),
  env.port,
)
console.log(`API ${env.buildTag} listening on http://localhost:${String(env.port)}`)

// docker stop sends SIGTERM and kills the process 10s later. Answer the
// requests already running and close the pool, so nothing is cut off.
function shutdown(signal: NodeJS.Signals) {
  console.log(`${signal} received, finishing open requests`)
  stopServer(server)
    .then(close)
    .catch((error: unknown) => {
      console.error('could not stop cleanly', error)
      process.exitCode = 1
    })
}
process.once('SIGTERM', shutdown)
process.once('SIGINT', shutdown)
