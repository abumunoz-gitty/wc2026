import type { Metadata } from 'next'
import './globals.css'
import { TopBar } from '@/components/ui/TopBar'
import { NavBar } from '@/components/ui/NavBar'
import { AuthProvider } from '@/components/ui/AuthProvider'

export const metadata: Metadata = {
  title: 'WC 2026',
  description: '2026 FIFA World Cup tracker, picks & leaderboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <AuthProvider>
          <TopBar />
          <NavBar />
          <main style={{ padding: '16px', maxWidth: '680px', margin: '0 auto' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}