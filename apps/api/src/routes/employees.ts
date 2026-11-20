import { Router } from 'express'
import type { EmployeeController } from '../controllers/employee-controller'

export function createEmployeesRouter(controller: EmployeeController) {
  const router = Router()
  router.get('/api/employees', controller.list)
  router.post('/api/employees', controller.create)
  router.get('/api/employees/:id', controller.getById)
  router.patch('/api/employees/:id', controller.update)
  router.delete('/api/employees/:id', controller.delete)
  return router
}
