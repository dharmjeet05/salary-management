import { createApp } from './app'
import { loadEnv } from './config/env'
import { startServer } from './start-server'

const env = loadEnv()
await startServer(createApp({ corsOrigin: env.corsOrigin }), env.port)
console.log(`API listening on http://localhost:${String(env.port)}`)
