import type { ErrorRequestHandler, RequestHandler, Response } from 'express'
import { ZodError } from 'zod'
import { DomainError, type ErrorCode, type ErrorDetail } from '../errors/domain-errors'

const statusByCode: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  INTERNAL_ERROR: 500,
}

function sendError(res: Response, code: ErrorCode, message: string, details?: ErrorDetail[]) {
  res
    .status(statusByCode[code])
    .json({ error: details ? { code, message, details } : { code, message } })
}

// body-parser marks a broken JSON body with this type
function isBadJson(error: unknown) {
  return error instanceof SyntaxError && 'type' in error && error.type === 'entity.parse.failed'
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  sendError(res, 'NOT_FOUND', 'Route not found')
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    sendError(res, 'VALIDATION_ERROR', 'Invalid request', details)
    return
  }
  if (isBadJson(error)) {
    sendError(res, 'VALIDATION_ERROR', 'Request body is not valid JSON')
    return
  }
  if (error instanceof DomainError) {
    sendError(res, error.code, error.message, error.details)
    return
  }
  console.error(error)
  sendError(res, 'INTERNAL_ERROR', 'Something went wrong')
}
