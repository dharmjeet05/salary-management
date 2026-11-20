import type { Database } from '@salary/db'
import cors from 'cors'
import express from 'express'
import { createEmployeeController } from './controllers/employee-controller'
import { createInsightsController } from './controllers/insights-controller'
import { errorHandler, notFoundHandler } from './middleware/error-handler'
import { createEmployeeRepository } from './repositories/employee-repository'
import { createInsightsRepository } from './repositories/insights-repository'
import { createEmployeesRouter } from './routes/employees'
import { healthRouter } from './routes/health'
import { createInsightsRouter } from './routes/insights'
import { metaRouter } from './routes/meta'
import { createEmployeeService } from './services/employee-service'
import { createInsightsService } from './services/insights-service'

export type AppOptions = { corsOrigin: string; db: Database; buildTag?: string }

export function createApp({ corsOrigin, db, buildTag = 'dev' }: AppOptions) {
  const employees = createEmployeeController(createEmployeeService(createEmployeeRepository(db)))
  const insights = createInsightsController(createInsightsService(createInsightsRepository(db)))

  const app = express()
  app.disable('x-powered-by')
  // the commit this runs, so `curl -I` after a deploy shows which build answers
  app.use((_req, res, next) => {
    res.setHeader('X-Build', buildTag)
    next()
  })
  // A list, so the header only shows up for the allowed origin
  app.use(cors({ origin: [corsOrigin] }))
  app.use(express.json())
  app.use(healthRouter)
  app.use(metaRouter)
  app.use(createEmployeesRouter(employees))
  app.use(createInsightsRouter(insights))
  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
