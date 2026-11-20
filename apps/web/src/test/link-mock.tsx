import type NextLink from 'next/link'
import type { ComponentProps } from 'react'

// next/link renders an <a>, but whether it prefetches never shows in the DOM.
// This stand-in shows it, so a test can check which links prefetch.
// Use it with: vi.mock('next/link', () => import('@/test/link-mock'))
export default function Link({
  href,
  prefetch,
  className,
  children,
}: ComponentProps<typeof NextLink>) {
  return (
    <a
      href={typeof href === 'string' ? href : (href.pathname ?? '')}
      className={className}
      data-prefetch={prefetch === false ? 'off' : 'on'}
    >
      {children}
    </a>
  )
}
