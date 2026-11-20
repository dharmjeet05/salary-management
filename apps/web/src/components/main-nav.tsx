'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const sections = [
  { href: '/employees', label: 'Employees' },
  { href: '/insights', label: 'Insights' },
] as const

export function MainNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Main">
      <ul className="flex gap-1">
        {sections.map((section) => {
          const isActive = pathname === section.href || pathname.startsWith(`${section.href}/`)
          return (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {section.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
