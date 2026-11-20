import { COUNTRIES, DEPARTMENTS, type MetaResponse } from '@salary/shared'
import type { Request, Response } from 'express'

const meta: MetaResponse = {
  countries: [...COUNTRIES],
  departments: DEPARTMENTS.map((department) => ({
    name: department.name,
    jobTitles: [...department.jobTitles],
  })),
}

export function getMeta(_req: Request, res: Response) {
  res.json(meta)
}
