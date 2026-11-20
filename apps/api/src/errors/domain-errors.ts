export type ErrorCode =
  'VALIDATION_ERROR' | 'NOT_FOUND' | 'EMAIL_TAKEN' | 'PAYLOAD_TOO_LARGE' | 'INTERNAL_ERROR'

export type ErrorDetail = { path: string; message: string }

// Errors a service throws on purpose. They carry a code for the client and
// know nothing about HTTP, the error middleware picks the status.
export class DomainError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: ErrorDetail[],
  ) {
    super(message)
    this.name = new.target.name
  }
}

export class NotFoundError extends DomainError {
  constructor(thing: string) {
    super('NOT_FOUND', `${thing} not found`)
  }
}

const emailTakenMessage = 'This email is already used by another employee'

export class EmailTakenError extends DomainError {
  constructor() {
    super('EMAIL_TAKEN', emailTakenMessage, [{ path: 'email', message: emailTakenMessage }])
  }
}
