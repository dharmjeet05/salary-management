import { describe, expect, it } from 'vitest'
import { formatMoney } from './format'

describe('formatting money', () => {
  it('uses indian grouping for rupees', () => {
    expect(formatMoney(1_747_500, 'INR')).toBe('₹17,47,500')
  })

  it('shows dollars with the dollar sign', () => {
    expect(formatMoney(106_000, 'USD')).toBe('$106,000')
  })

  it('shows euros with the euro sign', () => {
    expect(formatMoney(76_000, 'EUR')).toBe('€76,000')
  })

  it('shows no decimals, since salaries are whole units', () => {
    expect(formatMoney(80_000, 'GBP')).toBe('£80,000')
  })
})
