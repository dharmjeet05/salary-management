import type { ErrorRequestHandler, RequestHandler, Response } from 'express'
import { ZodError } from 'zod'
import { DomainError, type ErrorCode, type ErrorDetail } from '../errors/domain-errors'

const statusByCode: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  EMAIL_TAKEN: 409,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_ERROR: 500,
}

function sendError(res: Response, code: ErrorCode, message: string, details?: ErrorDetail[]) {
  res
    .status(statusByCode[code])
    .json({ error: details ? { code, message, details } : { code, message } })
}

// body-parser tags the errors it throws with a `type` and marks the ones caused
// by the client with `expose`, for example a broken, too large or unreadable body
function bodyParserClientErrorType(error: unknown) {
  if (typeof error !== 'object' || error === null) return undefined
  if (!('type' in error) || typeof error.type !== 'string') return undefined
  if (!('expose' in error) || error.expose !== true) return undefined
  return error.type
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  sendError(res, 'NOT_FOUND', 'Route not found')
}

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, next) => {
  // A response that already started can't get a second one. Express's own
  // handler closes the connection instead.
  if (res.headersSent) {
    next(error)
    return
  }
  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    sendError(res, 'VALIDATION_ERROR', 'Invalid request', details)
    return
  }
  const bodyErrorType = bodyParserClientErrorType(error)
  if (bodyErrorType === 'entity.parse.failed') {
    sendError(res, 'VALIDATION_ERROR', 'Request body is not valid JSON')
    return
  }
  if (bodyErrorType === 'entity.too.large') {
    sendError(res, 'PAYLOAD_TOO_LARGE', 'Request body is too large')
    return
  }
  if (bodyErrorType !== undefined) {
    sendError(res, 'VALIDATION_ERROR', 'Request body could not be read')
    return
  }
  if (error instanceof DomainError) {
    sendError(res, error.code, error.message, error.details)
    return
  }
  console.error(req.method, req.originalUrl, error)
  sendError(res, 'INTERNAL_ERROR', 'Something went wrong')
}
