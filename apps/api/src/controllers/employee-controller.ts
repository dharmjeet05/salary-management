import {
  createEmployeeSchema,
  employeeIdParamSchema,
  employeeListQuerySchema,
  updateEmployeeSchema,
} from '@salary/shared'
import type { Request, Response } from 'express'
import type { EmployeeService } from '../services/employee-service'

export function createEmployeeController(service: EmployeeService) {
  return {
    list: async (req: Request, res: Response) => {
      const query = employeeListQuerySchema.parse(req.query)
      res.json(await service.list(query))
    },

    getById: async (req: Request, res: Response) => {
      const { id } = employeeIdParamSchema.parse(req.params)
      res.json(await service.getById(id))
    },

    create: async (req: Request, res: Response) => {
      const input = createEmployeeSchema.parse(req.body)
      res.status(201).json(await service.create(input))
    },

    update: async (req: Request, res: Response) => {
      const { id } = employeeIdParamSchema.parse(req.params)
      const input = updateEmployeeSchema.parse(req.body)
      res.json(await service.update(id, input))
    },

    delete: async (req: Request, res: Response) => {
      const { id } = employeeIdParamSchema.parse(req.params)
      await service.delete(id)
      res.status(204).end()
    },
  }
}

export type EmployeeController = ReturnType<typeof createEmployeeController>
