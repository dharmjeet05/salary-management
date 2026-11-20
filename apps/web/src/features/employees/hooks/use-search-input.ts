'use client'

import { useEffect, useEffectEvent, useState } from 'react'
import { useDebouncedValue } from '@/lib/use-debounced-value'

const SEARCH_DELAY_MS = 300
const MIN_SEARCH_LENGTH = 2

// The box shows what is typed right away, and the url follows once typing
// stops. When the url changes from outside (clear filters, back button), the
// box follows the url.
export function useSearchInput(urlSearch: string | undefined, onSearch: (value?: string) => void) {
  const [text, setText] = useState(urlSearch ?? '')
  const [lastUrlSearch, setLastUrlSearch] = useState(urlSearch)
  if (urlSearch !== lastUrlSearch) {
    setLastUrlSearch(urlSearch)
    if ((urlSearch ?? '') !== text.trim()) setText(urlSearch ?? '')
  }

  const debounced = useDebouncedValue(text, SEARCH_DELAY_MS)
  const applySearch = useEffectEvent((value: string) => {
    const next = value.trim() === '' ? undefined : value.trim()
    if (next !== undefined && next.length < MIN_SEARCH_LENGTH) return
    if (next !== urlSearch) onSearch(next)
  })
  useEffect(() => {
    applySearch(debounced)
  }, [debounced])

  return { text, setText }
}
