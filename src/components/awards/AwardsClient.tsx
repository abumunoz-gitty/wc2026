'use client'

import { useState } from 'react'

interface Team {
  id: string
  name: string
  flag_emoji: string
  country_code: string
}

interface AwardPick {
  award_type: string
  predicted_team_id: string | null
  predicted_player: string | null
}

interface Props {
  teams: Team[]
  userAwardPicks: AwardPick[]
  isLoggedIn: boolean
}

const AWARDS = [
  { key: 'tournament_winner', title: 'Tournament Winner', description: 'Which team lifts the trophy on July 19?', type: 'team' },
  { key: 'golden_boot', title: 'Golden Boot', description: 'Top scorer of the tournament', type: 'player' },
  { key: 'golden_ball', title: 'Golden Ball', description: 'Best player of the tournament', type: 'player' },
  { key: 'golden_glove', title: 'Golden Glove', description: 'Best goalkeeper of the tournament', type: 'player' },
]

export function AwardsClient({ teams, userAwardPicks, isLoggedIn }: Props) {
  const [picks, setPicks] = useState<AwardPick[]>(userAwardPicks)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [playerInputs, setPlayerInputs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const p of userAwardPicks) {
      if (p.predicted_player) initial[p.award_type] = p.predicted_player
    }
    return initial
  })

  function getPickForAward(awardType: string) {
    return picks.find(p => p.award_type === awardType)
  }

  function getTeamById(id: string) {
    return teams.find(t => t.id === id)
  }

  async function saveAwardPick(awardType: string, teamId: string | null, player: string | null) {
    if (!isLoggedIn) return
    setSaving(awardType)
    const res = await fetch('/api/awards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ award_type: awardType, predicted_team_id: teamId, predicted_player: player }),
    })
    if (res.ok) {
      const { pick } = await res.json()
      setPicks(prev => {
        const existing = prev.findIndex(p => p.award_type === awardType)
        if (existing >= 0) { const updated = [...prev]; updated[existing] = pick; return updated }
        return [...prev, pick]
      })
      setSaved(awardType)
      setTimeout(() => setSaved(null), 2000)
    }
    setSaving(null)
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>Tournament awards</div>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>5 pts each if correct</div>
      </div>

      {!isLoggedIn && (
        <div style={{ background: 'rgba(0,232,228,0.07)', border: '0.5px solid rgba(0,232,228,0.18)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Sign in to make award picks</div>
          <a href="/auth" style={{ fontSize: '13px', fontWeight: 500, color: '#00E8E4', textDecoration: 'none', padding: '6px 14px', border: '0.5px solid rgba(0,232,228,0.4)', borderRadius: '8px', background: 'rgba(0,232,228,0.1)' }}>Sign in</a>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {AWARDS.map(award => {
          const pick = getPickForAward(award.key)
          const pickedTeam = pick?.predicted_team_id ? getTeamById(pick.predicted_team_id) : null
          const isSaving = saving === award.key
          const isSaved = saved === award.key
          return (
            <div key={award.key} style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '16px' }}>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '15px', fontWeight: 500, color: '#fff', marginBottom: '2px' }}>{award.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{award.description}</div>
              </div>

              {pick && (
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px', padding: '8px 12px', background: 'rgba(0,232,228,0.06)', borderRadius: '8px', border: '0.5px solid rgba(0,232,228,0.15)' }}>
                  Your pick:
                  {pickedTeam && <span style={{ color: '#fff', marginLeft: '6px' }}>{pickedTeam.flag_emoji} {pickedTeam.name}</span>}
                  {pick.predicted_player && <span style={{ color: '#fff', marginLeft: '6px' }}>{pick.predicted_player}</span>}
                </div>
              )}

              {isLoggedIn && award.type === 'team' && (
                <select
                  defaultValue={pick?.predicted_team_id ?? ''}
                  onChange={e => { if (e.target.value) saveAwardPick(award.key, e.target.value, null) }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '0.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '13px', cursor: 'pointer' }}
                >
                  <option value="" style={{ background: '#0d1220' }}>Select a team...</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id} style={{ background: '#0d1220' }}>{t.flag_emoji} {t.name}</option>
                  ))}
                </select>
              )}

              {isLoggedIn && award.type === 'player' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Player name e.g. Mbappe"
                    value={playerInputs[award.key] ?? ''}
                    onChange={e => setPlayerInputs(prev => ({ ...prev, [award.key]: e.target.value }))}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '0.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '13px', outline: 'none' }}
                  />
                  <button
                    onClick={() => saveAwardPick(award.key, null, playerInputs[award.key] ?? '')}
                    disabled={isSaving || !playerInputs[award.key]}
                    style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, cursor: 'pointer', border: isSaved ? '0.5px solid rgba(0,232,228,0.4)' : '0.5px solid var(--border-strong)', background: isSaved ? 'rgba(0,232,228,0.12)' : 'rgba(255,255,255,0.07)', color: isSaved ? '#00E8E4' : '#fff' }}
                  >
                    {isSaving ? '...' : isSaved ? 'Saved' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}