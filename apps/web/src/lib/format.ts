import type { Currency } from '@salary/shared'

// Rupees read best with Indian grouping (17,47,500). Everything else uses
// plain English grouping.
const localeByCurrency: Partial<Record<Currency, string>> = { INR: 'en-IN' }

export function formatMoney(amount: number, currency: Currency) {
  return new Intl.NumberFormat(localeByCurrency[currency] ?? 'en', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}
