import { describe, expect, it } from 'vitest'
import { formatDate } from './format'

describe('formatting dates', () => {
  it('shows day, short month and year', () => {
    expect(formatDate('2022-04-11')).toBe('11 Apr 2022')
  })

  it('does not shift the day in a time zone behind utc', () => {
    expect(formatDate('2022-01-01')).toBe('1 Jan 2022')
  })
})
