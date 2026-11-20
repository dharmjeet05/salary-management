import { Router } from 'express'
import type { InsightsController } from '../controllers/insights-controller'

export function createInsightsRouter(controller: InsightsController) {
  const router = Router()
  router.get('/api/insights/countries', controller.countries)
  router.get('/api/insights/countries/:country/job-titles', controller.jobTitles)
  router.get('/api/insights/countries/:country/departments', controller.departments)
  router.get('/api/insights/countries/:country/underpaid', controller.underpaid)
  return router
}
