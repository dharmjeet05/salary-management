import { Router } from 'express'
import { getMeta } from '../controllers/meta-controller'

export const metaRouter = Router()

metaRouter.get('/api/meta', getMeta)
