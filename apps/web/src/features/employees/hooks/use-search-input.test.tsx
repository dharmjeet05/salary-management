import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSearchInput } from './use-search-input'

const pushed: (string | undefined)[] = []

// The url comes in as a prop, so the test decides when it changes, like a
// router that is still catching up.
function SearchBox({ url }: { url: string | undefined }) {
  const search = useSearchInput(url, (value) => {
    pushed.push(value)
  })
  return (
    <input
      aria-label="Search"
      value={search.text}
      onChange={(event) => {
        search.setText(event.target.value)
      }}
    />
  )
}

let rerender: (ui: React.ReactNode) => void

function box() {
  return screen.getByLabelText<HTMLInputElement>('Search')
}

function type(value: string) {
  fireEvent.change(box(), { target: { value } })
}

function waitForDebounce() {
  act(() => {
    vi.advanceTimersByTime(300)
  })
}

function urlBecomes(value: string | undefined) {
  rerender(<SearchBox url={value} />)
}

beforeEach(() => {
  vi.useFakeTimers()
  pushed.length = 0
  rerender = render(<SearchBox url={undefined} />).rerender
})

afterEach(() => {
  vi.useRealTimers()
})

describe('search box', () => {
  it('puts the search in the url once typing stops', () => {
    type('patel')
    waitForDebounce()
    expect(pushed).toEqual(['patel'])
  })

  it('keeps a letter typed while the url catches up', () => {
    type('pa')
    waitForDebounce()
    type('pat')
    urlBecomes('pa')
    expect(box().value).toBe('pat')
  })

  it('follows the url when it changes from outside, like clear filters', () => {
    type('patel')
    waitForDebounce()
    urlBecomes('patel')
    urlBecomes(undefined)
    expect(box().value).toBe('')
  })

  it('does not put a one letter search in the url', () => {
    type('p')
    waitForDebounce()
    expect(pushed).toEqual([])
  })
})
