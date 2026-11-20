import type { Database } from '@salary/db'
import cors from 'cors'
import express from 'express'
import { createEmployeeController } from './controllers/employee-controller'
import { errorHandler, notFoundHandler } from './middleware/error-handler'
import { createEmployeeRepository } from './repositories/employee-repository'
import { createEmployeesRouter } from './routes/employees'
import { healthRouter } from './routes/health'
import { metaRouter } from './routes/meta'
import { createEmployeeService } from './services/employee-service'

export type AppOptions = { corsOrigin: string; db: Database }

export function createApp({ corsOrigin, db }: AppOptions) {
  const employees = createEmployeeController(createEmployeeService(createEmployeeRepository(db)))

  const app = express()
  app.disable('x-powered-by')
  // A list, so the header only shows up for the allowed origin
  app.use(cors({ origin: [corsOrigin] }))
  app.use(express.json())
  app.use(healthRouter)
  app.use(metaRouter)
  app.use(createEmployeesRouter(employees))
  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
