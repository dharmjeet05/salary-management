import { countryParamSchema, underpaidQuerySchema } from '@salary/shared'
import type { Request, Response } from 'express'
import type { InsightsService } from '../services/insights-service'

export function createInsightsController(service: InsightsService) {
  return {
    countries: async (_req: Request, res: Response) => {
      res.json(await service.countries())
    },

    jobTitles: async (req: Request, res: Response) => {
      const { country } = countryParamSchema.parse(req.params)
      res.json(await service.jobTitles(country))
    },

    departments: async (req: Request, res: Response) => {
      const { country } = countryParamSchema.parse(req.params)
      res.json(await service.departments(country))
    },

    underpaid: async (req: Request, res: Response) => {
      const { country } = countryParamSchema.parse(req.params)
      const { threshold } = underpaidQuerySchema.parse(req.query)
      res.json(await service.underpaid(country, threshold))
    },
  }
}

export type InsightsController = ReturnType<typeof createInsightsController>
