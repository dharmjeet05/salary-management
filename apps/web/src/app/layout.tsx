import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { MainNav } from '@/components/main-nav'
import { Toaster } from '@/components/ui/sonner'
import { QueryProvider } from '@/lib/query-provider'
import { cn } from '@/lib/utils'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Salary Management',
  description: 'Manage employee salaries and see how ACME pays people',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)}>
      <body className="min-h-screen antialiased">
        <QueryProvider>
          <header className="border-b">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-6">
              <Link href="/employees" className="text-sm font-semibold">
                ACME Salaries
              </Link>
              <MainNav />
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
          <Toaster position="bottom-right" />
        </QueryProvider>
      </body>
    </html>
  )
}
