const UNIQUE_VIOLATION = '23505'

// Drizzle wraps the driver's error, so look through the cause chain for the
// Postgres error that names the constraint.
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  let current: unknown = error
  while (typeof current === 'object' && current !== null) {
    if (
      'code' in current &&
      current.code === UNIQUE_VIOLATION &&
      'constraint' in current &&
      current.constraint === constraint
    ) {
      return true
    }
    current = 'cause' in current ? current.cause : undefined
  }
  return false
}
