import cors from 'cors'
import express from 'express'
import { errorHandler, notFoundHandler } from './middleware/error-handler'
import { healthRouter } from './routes/health'

export type AppOptions = { corsOrigin: string }

export function createApp({ corsOrigin }: AppOptions) {
  const app = express()
  app.disable('x-powered-by')
  // A list, so the header only shows up for the allowed origin
  app.use(cors({ origin: [corsOrigin] }))
  app.use(express.json())
  app.use(healthRouter)
  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
