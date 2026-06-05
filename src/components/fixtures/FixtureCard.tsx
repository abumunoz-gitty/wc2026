'use client'

import { useState } from 'react'
import { Lock, Clock, Sparkles } from 'lucide-react'
import type { Fixture, Pick, BroadcasterUS } from '@/types'
import { formatKickoffET } from '@/lib/dates'
import { isPickLocked } from '@/lib/scoring'
import { getTeamColor } from '@/lib/team-colors'
import { BROADCASTER_STYLES } from '@/lib/broadcasters'

interface Props {
  fixture: Fixture
  pick?: Pick
  showPickInput?: boolean
  onPickSave?: (fixtureId: string, home: number, away: number) => Promise<void>
  aiPreview?: string
}

export function FixtureCard({
  fixture,
  pick,
  showPickInput = false,
  onPickSave,
  aiPreview,
}: Props) {
  const [homeScore, setHomeScore] = useState(pick?.pred_home_score ?? 0)
  const [awayScore, setAwayScore] = useState(pick?.pred_away_score ?? 0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const locked = isPickLocked(fixture.kickoff_et)
  const homeColor = getTeamColor(fixture.home_team.country_code)
  const awayColor = getTeamColor(fixture.away_team.country_code)
  const isLive = fixture.status === 'live'
  const isFinished = fixture.status === 'finished'

  async function handleSave() {
    if (!onPickSave || locked) return
    setSaving(true)
    await onPickSave(fixture.id, homeScore, awayScore)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function getPointsBadge() {
    if (pick?.points_earned === 3) return { label: '+3 pts — exact score', cls: 'badge-3pt' }
    if (pick?.points_earned === 1) return { label: '+1 pt — right winner', cls: 'badge-1pt' }
    if (pick?.points_earned === 0) return { label: '0 pts', cls: 'badge-0pt' }
    return null
  }

  const badge = getPointsBadge()

  return (
    <div className="fixture-glass" style={{ padding: '14px 16px' }}>
      {/* Color tint layers */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <div style={{ flex: 1, background: `linear-gradient(90deg, ${homeColor}, transparent)`, opacity: 0.13 }} />
        <div style={{ flex: 1, background: `linear-gradient(270deg, ${awayColor}, transparent)`, opacity: 0.13 }} />
      </div>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent 28%, rgba(10,14,26,0.65) 50%, transparent 72%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {fixture.stage === 'group' ? `Group ${fixture.home_team.country_code} · Matchday` : fixture.stage.toUpperCase()}
          </span>
          {isLive ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#f87171', fontWeight: 500 }}>
              <span className="live-dot" /> Live
            </span>
          ) : isFinished ? (
            <span style={{ fontSize: '11px', color: '#4ade80' }}>Final</span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--muted)' }}>
              <Clock size={12} />
              {formatKickoffET(fixture.kickoff_et)}
            </span>
          )}
        </div>

        {/* Teams + score */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{fixture.home_team.flag_emoji}</span>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>{fixture.home_team.name}</span>
          </div>

          <div style={{ textAlign: 'center', minWidth: '52px' }}>
            {isFinished || isLive ? (
              <span style={{ fontSize: '20px', fontWeight: 500, color: '#fff', letterSpacing: '1px' }}>
                {fixture.home_score} <span style={{ color: 'var(--dim)' }}>–</span> {fixture.away_score}
              </span>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--dim)' }}>vs</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: 'row-reverse' }}>
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{fixture.away_team.flag_emoji}</span>
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#fff' }}>{fixture.away_team.name}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '0.5px solid var(--border)' }}>
          {/* Broadcaster pills */}
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {fixture.broadcasters_us.map((b) => {
              const s = BROADCASTER_STYLES[b as BroadcasterUS]
              if (!s) return null
              return (
                <span
                  key={b}
                  style={{
                    fontSize: '10px', fontWeight: 500,
                    padding: '3px 8px', borderRadius: '20px',
                    border: `0.5px solid ${s.border}`,
                    background: s.bg, color: s.text,
                  }}
                >
                  {s.label}
                </span>
              )
            })}
          </div>

          {/* Pick section */}
          {isFinished && badge ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted)' }}>
              <Lock size={12} />
              Pick: {pick?.pred_home_score}–{pick?.pred_away_score} ·
              <span className={badge.cls} style={{ fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: '20px', border: '0.5px solid' }}>
                {badge.label}
              </span>
            </div>
          ) : locked && pick ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--muted)' }}>
              <Lock size={12} />
              Pick: {pick.pred_home_score}–{pick.pred_away_score}
            </div>
          ) : showPickInput && !locked ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Pick:</span>
              <input
                type="number"
                className="score-input"
                value={homeScore}
                min={0} max={20}
                onChange={(e) => setHomeScore(Number(e.target.value))}
                style={{ width: '34px', height: '28px', textAlign: 'center', fontSize: '13px', fontWeight: 500, borderRadius: '8px' }}
              />
              <span style={{ fontSize: '13px', color: 'var(--dim)' }}>–</span>
              <input
                type="number"
                className="score-input"
                value={awayScore}
                min={0} max={20}
                onChange={(e) => setAwayScore(Number(e.target.value))}
                style={{ width: '34px', height: '28px', textAlign: 'center', fontSize: '13px', fontWeight: 500, borderRadius: '8px' }}
              />
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  fontSize: '11px', padding: '5px 12px', borderRadius: '8px', cursor: 'pointer',
                  border: saved ? '0.5px solid rgba(0,232,228,0.4)' : '0.5px solid var(--border-strong)',
                  background: saved ? 'rgba(0,232,228,0.12)' : 'rgba(255,255,255,0.07)',
                  color: saved ? 'var(--cyan)' : '#fff',
                }}
              >
                {saving ? '...' : saved ? 'Saved ✓' : 'Save'}
              </button>
            </div>
          ) : null}
        </div>

        {/* AI Preview */}
        {aiPreview && (
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            borderLeft: '2px solid rgba(255,255,255,0.2)',
            padding: '10px 12px',
            marginTop: '10px',
            fontSize: '11px',
            color: 'var(--muted)',
            lineHeight: 1.6,
          }}>
            <Sparkles size={12} style={{ color: 'var(--cyan)', marginRight: '4px', display: 'inline' }} />
            {aiPreview}
          </div>
        )}
      </div>
    </div>
  )
}
