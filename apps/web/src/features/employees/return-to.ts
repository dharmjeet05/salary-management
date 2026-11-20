const LIST_PATH = '/employees'
const RETURN_PATHS = [LIST_PATH, '/insights']

// Where to go after add, save, delete or cancel: the employee list or the
// insights view the person came from, as they left it. Only those two pages
// are accepted, so a crafted link can't send anyone to another site or page.
export function listReturnPath(from: string | null | undefined) {
  const isKnownPage = RETURN_PATHS.some(
    (path) => from === path || from?.startsWith(`${path}?`) === true,
  )
  return isKnownPage && from ? from : LIST_PATH
}

export function withReturnTo(href: string, returnTo: string) {
  if (returnTo === LIST_PATH) return href
  return `${href}?from=${encodeURIComponent(returnTo)}`
}
