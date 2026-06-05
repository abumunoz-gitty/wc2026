'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Dashboard', href: '/' },
  { label: 'Picks',     href: '/picks' },
  { label: 'Standings', href: '/leaderboard' },
  { label: 'Bracket',   href: '/bracket' },
  { label: 'Groups',    href: '/groups' },
  { label: 'Awards',    href: '/awards' },
  { label: 'Teams',     href: '/teams' },
]

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        display: 'flex',
        padding: '0 8px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {TABS.map((tab) => {
        const isActive =
          tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              height: '44px',
              fontSize: '13px',
              fontWeight: 500,
              color: isActive ? 'var(--cyan)' : '#8b95b0',
              background: 'transparent',
              borderBottom: '2px solid transparent',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
