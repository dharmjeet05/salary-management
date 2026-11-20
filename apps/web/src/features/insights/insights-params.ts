import { COUNTRY_CODES, type CountryCode } from '@salary/shared'

export const THRESHOLDS = [0.7, 0.8, 0.9] as const
export type Threshold = (typeof THRESHOLDS)[number]
const DEFAULT_THRESHOLD: Threshold = 0.8

export type InsightsParams = { country?: CountryCode; threshold: Threshold }

export function readInsightsParams(search: { get(name: string): string | null }): InsightsParams {
  const country = COUNTRY_CODES.find((code) => code === search.get('country'))
  const threshold =
    THRESHOLDS.find((value) => String(value) === search.get('threshold')) ?? DEFAULT_THRESHOLD
  return country ? { country, threshold } : { threshold }
}

export function writeInsightsParams(params: InsightsParams) {
  const query = new URLSearchParams()
  if (params.country) query.set('country', params.country)
  if (params.threshold !== DEFAULT_THRESHOLD) query.set('threshold', String(params.threshold))
  return query.toString()
}
