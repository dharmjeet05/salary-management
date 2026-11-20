'use client'

import { useEffect, useEffectEvent, useState } from 'react'
import { useDebouncedValue } from '@/lib/use-debounced-value'

const SEARCH_DELAY_MS = 300
const MIN_SEARCH_LENGTH = 2

function searchValue(text: string) {
  const trimmed = text.trim()
  return trimmed === '' ? undefined : trimmed
}

// The box shows what is typed right away, and the url follows once typing
// stops. When the url changes from outside (clear filters, back button), the
// box follows the url. When the url only catches up with our own push, the
// box keeps what was typed since, so no letter gets lost.
export function useSearchInput(urlSearch: string | undefined, onSearch: (value?: string) => void) {
  const [text, setText] = useState(urlSearch ?? '')
  const [lastUrlSearch, setLastUrlSearch] = useState(urlSearch)
  const debounced = useDebouncedValue(text, SEARCH_DELAY_MS)

  if (urlSearch !== lastUrlSearch) {
    setLastUrlSearch(urlSearch)
    // the debounced text is what we last pushed, so a url equal to it is
    // our own push arriving
    const isOurOwnPush = urlSearch === searchValue(debounced)
    if (!isOurOwnPush && (urlSearch ?? '') !== text.trim()) setText(urlSearch ?? '')
  }

  const applySearch = useEffectEvent((value: string) => {
    const next = searchValue(value)
    if (next !== undefined && next.length < MIN_SEARCH_LENGTH) return
    if (next !== urlSearch) onSearch(next)
  })
  useEffect(() => {
    applySearch(debounced)
  }, [debounced])

  return { text, setText }
}
