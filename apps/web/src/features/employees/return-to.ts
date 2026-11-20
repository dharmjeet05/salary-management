const LIST_PATH = '/employees'

// Where to go after add, save, delete or cancel: the list the person came
// from, with its filters and page. Only the employee list is accepted, so a
// crafted link can't send anyone to another site or page.
export function listReturnPath(from: string | null | undefined) {
  if (from === LIST_PATH || from?.startsWith(`${LIST_PATH}?`)) return from
  return LIST_PATH
}

export function withReturnTo(href: string, returnTo: string) {
  if (returnTo === LIST_PATH) return href
  return `${href}?from=${encodeURIComponent(returnTo)}`
}
