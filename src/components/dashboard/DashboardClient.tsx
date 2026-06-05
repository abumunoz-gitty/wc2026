'use client'

import { useState } from 'react'
import { Trophy, Target, CheckCircle, Zap } from 'lucide-react'
import type { Fixture, Pick } from '@/types'
import { FixtureCard } from '@/components/fixtures/FixtureCard'
import { formatDateLabel } from '@/lib/dates'

interface Props {
  upcomingFixtures: Fixture[]
  liveFixtures: Fixture[]
  recentFixtures: Fixture[]
  userStats: { total_points: number; display_name: string } | null
  userPicks: Pick[]
  isLoggedIn: boolean
}

export function DashboardClient({
  upcomingFixtures,
  liveFixtures,
  recentFixtures,
  userStats,
  userPicks,
  isLoggedIn,
}: Props) {
  const [picks, setPicks] = useState<Pick[]>(userPicks)

  const exactScores = picks.filter(p => p.points_earned === 3).length
  const correctResults = picks.filter(p => p.points_earned != null).length
  const hitRate = correctResults > 0
    ? Math.round((picks.filter(p => (p.points_earned ?? 0) > 0).length / correctResults) * 100)
    : 0

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

  function getPickForFixture(fixtureId: string) {
    return picks.find(p => p.fixture_id === fixtureId)
  }

  // Group upcoming fixtures by date
  const upcomingByDate: Record<string, Fixture[]> = {}
  for (const f of upcomingFixtures) {
    const label = formatDateLabel(f.kickoff_et)
    if (!upcomingByDate[label]) upcomingByDate[label] = []
    upcomingByDate[label].push(f)
  }

  const todayLabel = formatDateLabel(new Date().toISOString())

  return (
    <div>
      {/* Metric cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        marginBottom: '20px',
      }}>
        <MetricCard
          icon={<Trophy size={14} />}
          label="Your points"
          value={userStats?.total_points ?? 0}
          sub={isLoggedIn ? `Hi ${userStats?.display_name ?? ''}` : 'Sign in to track'}
        />
        <MetricCard
          icon={<Target size={14} />}
          label="Picks made"
          value={picks.length}
          sub="of 104 games"
        />
        <MetricCard
          icon={<CheckCircle size={14} />}
          label="Correct results"
          value={correctResults}
          sub={`${hitRate}% hit rate`}
        />
        <MetricCard
          icon={<Zap size={14} />}
          label="Exact scores"
          value={exactScores}
          sub={`+${exactScores * 3} bonus pts`}
        />
      </div>

      {/* Live games */}
      {liveFixtures.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <SectionLabel>Live now</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {liveFixtures.map(f => (
              <FixtureCard
                key={f.id}
                fixture={f}
                pick={getPickForFixture(f.id)}
                showPickInput={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming grouped by date */}
      {Object.entries(upcomingByDate).map(([dateLabel, dayFixtures]) => (
        <section key={dateLabel} style={{ marginBottom: '20px' }}>
          <SectionLabel>
            {dateLabel === todayLabel ? `Today — ${dateLabel}` : `Upcoming — ${dateLabel}`}
          </SectionLabel>
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

      {/* Recent results */}
      {recentFixtures.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <SectionLabel>Recent results</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentFixtures.map(f => (
              <FixtureCard
                key={f.id}
                fixture={f}
                pick={getPickForFixture(f.id)}
                showPickInput={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state — only show if nothing at all */}
      {upcomingFixtures.length === 0 && liveFixtures.length === 0 && recentFixtures.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          color: 'var(--muted)',
          fontSize: '14px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚽</div>
          <div style={{ color: '#fff', fontWeight: 500, marginBottom: '6px' }}>No fixtures found</div>
          <div>The database may still be loading</div>
        </div>
      )}
    </div>
  )
}

function MetricCard({
  icon, label, value, sub,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  sub: string
}) {
  return (
    <div className="metric-card" style={{ padding: '12px 14px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        fontSize: '11px', color: '#fff', marginBottom: '6px',
      }}>
        <span style={{ color: 'var(--cyan)', opacity: 0.8 }}>{icon}</span>
        {label}
      </div>
      <div
        className="font-stat"
        style={{ fontSize: '26px', color: '#fff', lineHeight: 1, marginBottom: '4px' }}
      >
        {value}
      </div>
      <div style={{ fontSize: '11px', color: '#fff', opacity: 0.55 }}>{sub}</div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 500, color: '#fff',
      textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px',
    }}>
      {children}
    </div>
  )
}