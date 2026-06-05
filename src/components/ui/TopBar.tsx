'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Trophy, LogIn } from 'lucide-react'

export function TopBar() {
  const pathname = usePathname()
  const calActive = pathname === '/schedule'

  return (
    <header style={{
      background: 'var(--bg2)',
      borderBottom: '0.5px solid var(--border)',
      padding: '0 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '52px',
    }}>
      <Link href="/" style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        textDecoration: 'none',
      }}>
        <Trophy size={18} style={{ color: 'var(--gold)' }} />
        <span style={{ fontSize: '16px', fontWeight: 500, color: '#ffffff' }}>
          WC 2026{' '}
          <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 400 }}>
            friend group
          </span>
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Link
          href="/auth"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '44px', padding: '0 8px',
            color: pathname === '/auth' ? 'var(--cyan)' : '#8b95b0',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
        >
          <LogIn size={17} />
        </Link>

        <Link
          href="/schedule"
          aria-label="Full schedule"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '44px', padding: '0 6px',
            borderBottom: '2px solid transparent',
            color: calActive ? 'var(--cyan)' : '#8b95b0',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
        >
          <Calendar size={19} />
        </Link>
      </div>
    </header>
  )
}