'use client'

import type { Fixture } from '@/types'
import { formatKickoffET, formatDateLabel } from '@/lib/dates'

interface Props {
  fixtures: Fixture[]
}

const ROUND_LABELS: Record<string, string> = {
  r32:         'Round of 32',
  r16:         'Round of 16',
  qf:          'Quarterfinals',
  sf:          'Semifinals',
  third_place: '3rd Place',
  final:       'Final',
}

const ROUND_ORDER = ['r32', 'r16', 'qf', 'sf', 'third_place', 'final']

export function BracketClient({ fixtures }: Props) {
  const byRound: Record<string, Fixture[]> = {}
  for (const round of ROUND_ORDER) {
    byRound[round] = fixtures.filter(f => f.stage === round)
  }

  const hasAnyKnockout = fixtures.length > 0

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>
          Bracket
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
          Knockout rounds · updates as teams advance
        </div>
      </div>

      {!hasAnyKnockout && (
        <div style={{
          background: 'rgba(0,232,228,0.07)',
          border: '0.5px solid rgba(0,232,228,0.18)',
          borderRadius: '14px',
          padding: '32px',
          textAlign: 'center',
          marginBottom: '20px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>-</div>
          <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff', marginBottom: '8px' }}>
            Knockout stage not yet set
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: '320px', margin: '0 auto' }}>
            The Round of 32 draw will be confirmed after the group stage ends on June 29.
            Check back then to see the full bracket.
          </div>
        </div>
      )}

      {ROUND_ORDER.map(round => {
        const roundFixtures = byRound[round]
        if (roundFixtures.length === 0) return null
        return (
          <section key={round} style={{ marginBottom: '28px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '10px',
              paddingBottom: '8px',
              borderBottom: '0.5px solid rgba(255,255,255,0.1)',
            }}>
              {ROUND_LABELS[round]}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {roundFixtures.map(f => (
                <BracketMatch key={f.id} fixture={f} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function BracketMatch({ fixture }: { fixture: Fixture }) {
  const isFinished = fixture.status === 'finished'
  const isLive = fixture.status === 'live'

  const homeWon = isFinished && fixture.home_score !== null && fixture.away_score !== null && fixture.home_score > fixture.away_score
  const awayWon = isFinished && fixture.home_score !== null && fixture.away_score !== null && fixture.away_score > fixture.home_score

  return (
    <div style={{
      background: 'rgba(255,255,255,0.06)',
      border: '0.5px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      padding: '12px 16px',
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '18px' }}>{fixture.home_team?.flag_emoji ?? '-'}</span>
        <span style={{
          fontSize: '13px',
          fontWeight: homeWon ? 600 : 400,
          color: homeWon ? '#fff' : fixture.home_team ? '#fff' : 'var(--muted)',
        }}>
          {fixture.home_team?.name ?? 'TBD'}
        </span>
      </div>

      <div style={{ textAlign: 'center', minWidth: '60px' }}>
        {isFinished && fixture.home_score !== null ? (
          <span style={{ fontSize: '16px', fontWeight: 500, color: '#fff' }}>
            {fixture.home_score} - {fixture.away_score}
          </span>
        ) : isLive ? (
          <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 500 }}>Live</span>
        ) : (
          <div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
              {formatKickoffET(fixture.kickoff_et)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--dim)' }}>
              {formatDateLabel(fixture.kickoff_et)}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
        <span style={{
          fontSize: '13px',
          fontWeight: awayWon ? 600 : 400,
          color: awayWon ? '#fff' : fixture.away_team ? '#fff' : 'var(--muted)',
        }}>
          {fixture.away_team?.name ?? 'TBD'}
        </span>
        <span style={{ fontSize: '18px' }}>{fixture.away_team?.flag_emoji ?? '-'}</span>
      </div>
    </div>
  )
}