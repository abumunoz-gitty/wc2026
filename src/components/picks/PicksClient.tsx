'use client'

import { useState } from 'react'
import type { Fixture, Pick } from '@/types'
import { FixtureCard } from '@/components/fixtures/FixtureCard'
import { formatDateLabel } from '@/lib/dates'
import { isPickLocked } from '@/lib/scoring'

interface Props {
  fixtures: Fixture[]
  userPicks: Pick[]
  isLoggedIn: boolean
}

export function PicksClient({ fixtures, userPicks, isLoggedIn }: Props) {
  const [picks, setPicks] = useState<Pick[]>(userPicks)
  const [activeFilter, setActiveFilter] = useState('upcoming')

  function getPickForFixture(fixtureId: string) {
    return picks.find(p => p.fixture_id === fixtureId)
  }

  async function handlePickSave(fixtureId: string, home: number, away: number) {
    const res = await fetch('/api/picks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fixture_id: fixtureId,
        pred_home_score: home,
        pred_away_score: away,
      }),
    })
    if (res.ok) {
      const { pick } = await res.json()
      setPicks(prev => {
        const existing = prev.findIndex(p => p.fixture_id === fixtureId)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = pick
          return updated
        }
        return [...prev, pick]
      })
    }
  }

  const upcoming = fixtures.filter(f => f.status === 'scheduled' && !isPickLocked(f.kickoff_et))
  const pickedList = fixtures.filter(f => !!getPickForFixture(f.id) && f.status === 'scheduled')
  const missed = fixtures.filter(f => !getPickForFixture(f.id) && isPickLocked(f.kickoff_et) && f.status !== 'finished')
  const graded = fixtures.filter(f => f.status === 'finished')

  const filtered =
    activeFilter === 'upcoming' ? upcoming :
    activeFilter === 'picked' ? pickedList :
    activeFilter === 'missed' ? missed :
    graded

  const tabs = [
    { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
    { key: 'picked', label: 'Picked', count: pickedList.length },
    { key: 'missed', label: 'Missed', count: missed.length },
    { key: 'graded', label: 'Graded', count: graded.length },
  ]

  const byDate: Record<string, Fixture[]> = {}
  for (const f of filtered) {
    const label = formatDateLabel(f.kickoff_et)
    if (!byDate[label]) byDate[label] = []
    byDate[label].push(f)
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>
          Your picks
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
          {isLoggedIn ? picks.length + ' of 104 picks made' : 'Sign in to make picks'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              border: activeFilter === tab.key ? '0.5px solid #00E8E4' : '0.5px solid var(--border-strong)',
              background: activeFilter === tab.key ? 'rgba(0,232,228,0.12)' : 'rgba(255,255,255,0.05)',
              color: activeFilter === tab.key ? '#00E8E4' : 'var(--muted)',
              transition: 'all 0.15s',
            }}
          >
            {tab.label} {tab.count}
          </button>
        ))}
      </div>

      {Object.entries(byDate).map(([dateLabel, dayFixtures]) => (
        <section key={dateLabel} style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 500,
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '10px',
          }}>
            {dateLabel}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {dayFixtures.map(f => (
              <FixtureCard
                key={f.id}
                fixture={f}
                pick={getPickForFixture(f.id)}
                showPickInput={isLoggedIn}
                onPickSave={handlePickSave}
              />
            ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted)', fontSize: '14px' }}>
          <div style={{ color: '#fff', fontWeight: 500, marginBottom: '6px' }}>
            No fixtures in this category
          </div>
        </div>
      )}
    </div>
  )
}
