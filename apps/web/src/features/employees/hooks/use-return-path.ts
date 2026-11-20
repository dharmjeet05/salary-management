'use client'

import { useSearchParams } from 'next/navigation'
import { listReturnPath } from '../return-to'

export function useReturnPath() {
  return listReturnPath(useSearchParams().get('from'))
}
