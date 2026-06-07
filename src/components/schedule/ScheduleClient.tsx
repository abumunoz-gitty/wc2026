'use client'

import { useState } from 'react'
import type { Fixture } from '@/types'
import { FixtureCard } from '@/components/fixtures/FixtureCard'
import { formatDateLabel } from '@/lib/dates'

interface Props {
  fixtures: Fixture[]
}

const STAGES = [
  { key: 'all',         label: 'All' },
  { key: 'group',       label: 'Group stage' },
  { key: 'r32',         label: 'Round of 32' },
  { key: 'r16',         label: 'Round of 16' },
  { key: 'qf',          label: 'Quarterfinals' },
  { key: 'sf',          label: 'Semifinals' },
  { key: 'final',       label: 'Final' },
]

export function ScheduleClient({ fixtures }: Props) {
  const [activeStage, setActiveStage] = useState('all')

  const filtered = activeStage === 'all'
    ? fixtures
    : fixtures.filter(f => f.stage === activeStage)

  // Group by date
  const byDate: Record<string, Fixture[]> = {}
  for (const f of filtered) {
    const label = formatDateLabel(f.kickoff_et)
    if (!byDate[label]) byDate[label] = []
    byDate[label].push(f)
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>
          Full schedule
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
          104 games · Jun 11 – Jul 19 · All times ET
        </div>
      </div>

      {/* Stage filter tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap',
        marginBottom: '20px',
      }}>
        {STAGES.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveStage(s.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              border: activeStage === s.key
                ? '0.5px solid #00E8E4'
                : '0.5px solid var(--border-strong)',
              background: activeStage === s.key
                ? 'rgba(0,232,228,0.12)'
                : 'rgba(255,255,255,0.05)',
              color: activeStage === s.key ? '#00E8E4' : 'var(--muted)',
              transition: 'all 0.15s',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Fixtures grouped by date */}
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
                showPickInput={false}
              />
            ))}
          </div>
        </section>
      ))}

      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          color: 'var(--muted)',
          fontSize: '14px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📅</div>
          <div style={{ color: '#fff', fontWeight: 500, marginBottom: '6px' }}>
            No fixtures in this stage yet
          </div>
        </div>
      )}
    </div>
  )
}