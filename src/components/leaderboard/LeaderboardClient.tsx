'use client'

import type { LeaderboardEntry } from '@/types'

interface Props {
  standings: LeaderboardEntry[]
  currentUserId: string | null
}

export function LeaderboardClient({ standings, currentUserId }: Props) {
  const totalGames = 104

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>
          Standings
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
          Exact score = 3 pts · correct result = 1 pt · wrong = 0 pts
        </div>
      </div>

      {standings.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          color: 'var(--muted)',
          fontSize: '14px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>-</div>
          <div style={{ color: '#fff', fontWeight: 500, marginBottom: '6px' }}>
            No players yet
          </div>
          <div>Sign in and make picks to appear on the leaderboard</div>
        </div>
      )}

      {standings.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          borderRadius: '14px',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '32px 1fr 60px 50px 60px',
            gap: '8px',
            padding: '10px 16px',
            borderBottom: '0.5px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>#</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>Player</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', textAlign: 'right' }}>Pts</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', textAlign: 'right' }}>Exact</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', textAlign: 'right' }}>Results</div>
          </div>

          {standings.map((entry, index) => {
            const isMe = entry.user_id === currentUserId
            const isLast = index === standings.length - 1

            return (
              <div
                key={entry.user_id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px 1fr 60px 50px 60px',
                  gap: '8px',
                  padding: '12px 16px',
                  borderBottom: isLast ? 'none' : '0.5px solid rgba(255,255,255,0.05)',
                  background: isMe ? 'rgba(0,232,228,0.07)' : 'transparent',
                }}
              >
                <div style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: index === 0 ? '#f59e0b' : index === 1 ? '#8b95b0' : index === 2 ? '#ea580c' : 'var(--muted)',
                }}>
                  {entry.rank}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: isMe ? 'rgba(0,232,228,0.2)' : 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isMe ? '#00E8E4' : '#fff',
                    flexShrink: 0,
                  }}>
                    {entry.display_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: isMe ? 600 : 400, color: '#fff' }}>
                      {entry.display_name}
                      {isMe && (
                        <span style={{ fontSize: '10px', color: 'var(--cyan)', marginLeft: '6px' }}>you</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '1px' }}>
                      {entry.exact_scores} exact · {entry.correct_results} results
                    </div>
                  </div>
                </div>

                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#fff',
                  textAlign: 'right',
                  fontFamily: 'Barlow Condensed, sans-serif',
                }}>
                  {entry.total_points}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'right' }}>
                  {entry.exact_scores}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'right' }}>
                  {entry.correct_results}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{
        marginTop: '16px',
        fontSize: '12px',
        color: 'var(--muted)',
        textAlign: 'center',
      }}>
        {totalGames} games total · updates after each match
      </div>
    </div>
  )
}
