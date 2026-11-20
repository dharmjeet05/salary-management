import { describe, expect, it } from 'vitest'
import { listReturnPath, withReturnTo } from './return-to'

describe('going back to the list', () => {
  it('goes back to the filtered list it came from', () => {
    expect(listReturnPath('/employees?country=IN&page=3')).toBe('/employees?country=IN&page=3')
  })

  it('goes to the plain list when nothing says where it came from', () => {
    expect(listReturnPath(null)).toBe('/employees')
  })

  it('never sends someone to another site', () => {
    expect(listReturnPath('https://evil.example/employees')).toBe('/employees')
  })

  it('never follows a protocol relative link', () => {
    expect(listReturnPath('//evil.example/employees')).toBe('/employees')
  })

  it('goes back to the insights view it came from', () => {
    expect(listReturnPath('/insights?country=IN')).toBe('/insights?country=IN')
  })

  it('only goes back to the employee list or insights, not another page', () => {
    expect(listReturnPath('/employees/new')).toBe('/employees')
  })
})

describe('links that remember the list', () => {
  it('adds where it came from to the link', () => {
    expect(withReturnTo('/employees/new', '/employees?country=IN')).toBe(
      '/employees/new?from=%2Femployees%3Fcountry%3DIN',
    )
  })

  it('leaves the link plain when it came from the plain list', () => {
    expect(withReturnTo('/employees/1/edit', '/employees')).toBe('/employees/1/edit')
  })
})
