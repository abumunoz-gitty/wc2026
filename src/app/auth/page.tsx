'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignIn() {
    if (!email) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(0,232,228,0.07)',
        border: '0.5px solid rgba(0,232,228,0.18)',
        borderRadius: '16px',
        padding: '32px',
        width: '100%',
        maxWidth: '400px',
      }}>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>📬</div>
            <div style={{ fontSize: '18px', fontWeight: 500, color: '#fff', marginBottom: '8px' }}>
              Check your email
            </div>
            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
              We sent a magic link to <strong style={{ color: '#fff' }}>{email}</strong>.
              Click it to sign in — no password needed.
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '22px', fontWeight: 500, color: '#fff', marginBottom: '6px' }}>
                Sign in to WC 2026
              </div>
              <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
                Enter your email and we'll send you a magic link. No password needed.
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '0.5px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.07)',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <div style={{
                fontSize: '13px',
                color: '#f87171',
                marginBottom: '12px',
                padding: '8px 12px',
                background: 'rgba(248,113,113,0.1)',
                borderRadius: '8px',
                border: '0.5px solid rgba(248,113,113,0.3)',
              }}>
                {error}
              </div>
            )}

            <button
              onClick={handleSignIn}
              disabled={loading || !email}
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '8px',
                border: 'none',
                background: loading || !email ? 'rgba(0,232,228,0.3)' : '#00E8E4',
                color: '#0a0e1a',
                cursor: loading || !email ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Sending...' : 'Send magic link'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}