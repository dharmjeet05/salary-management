import { describe, expect, it } from 'vitest'
import { readInsightsParams, writeInsightsParams } from './insights-params'

describe('reading the insights view from the url', () => {
  it('reads a supported country', () => {
    expect(readInsightsParams(new URLSearchParams('country=GB')).country).toBe('GB')
  })

  it('drops a country we do not support', () => {
    expect(readInsightsParams(new URLSearchParams('country=FR')).country).toBeUndefined()
  })

  it('uses 80% of the median by default', () => {
    expect(readInsightsParams(new URLSearchParams()).threshold).toBe(0.8)
  })

  it('reads 70% from the url', () => {
    expect(readInsightsParams(new URLSearchParams('threshold=0.7')).threshold).toBe(0.7)
  })

  it('drops a threshold that is not offered', () => {
    expect(readInsightsParams(new URLSearchParams('threshold=0.5')).threshold).toBe(0.8)
  })
})

describe('writing the insights view to the url', () => {
  it('leaves out the default threshold', () => {
    expect(writeInsightsParams({ country: 'IN', threshold: 0.8 })).toBe('country=IN')
  })

  it('writes a threshold that is not the default', () => {
    expect(writeInsightsParams({ country: 'IN', threshold: 0.7 })).toBe('country=IN&threshold=0.7')
  })
})
