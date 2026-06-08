'use client'

import { useState } from 'react'

interface Team {
  id: string
  name: string
  flag_emoji: string
  country_code: string
  group_id: string
}

interface Group {
  id: string
  name: string
}

interface Props {
  teams: Team[]
  groups: Group[]
  existingPick: any
  isLoggedIn: boolean
}

const LOCK_TIME = new Date('2026-06-11T19:00:00Z') // 3pm ET June 11

function isLocked() {
  return new Date() >= LOCK_TIME
}

const POSITIONS = ['1st', '2nd', '3rd'] as const
type Position = typeof POSITIONS[number]

const KNOCKOUT_ROUNDS = [
  { key: 'r32', label: 'Round of 32', slots: 16 },
  { key: 'r16', label: 'Round of 16', slots: 8 },
  { key: 'qf',  label: 'Quarterfinals', slots: 4 },
  { key: 'sf',  label: 'Semifinals', slots: 2 },
]

export function BracketPicksClient({ teams, groups, existingPick, isLoggedIn }: Props) {
  const locked = isLocked()

  // Group stage picks: { 'A_1st': teamId, 'A_2nd': teamId, 'A_3rd': teamId, ... }
  const [groupPicks, setGroupPicks] = useState<Record<string, string>>(() => {
    if (!existingPick) return {}
    const initial: Record<string, string> = {}
    for (const g of ['A','B','C','D','E','F','G','H','I','J','K','L']) {
      for (const pos of ['1st','2nd','3rd']) {
        const key = `group_${g.toLowerCase()}_${pos.replace('st','').replace('nd','').replace('rd','')}${pos === '1st' ? 'st' : pos === '2nd' ? 'nd' : 'rd'}`
        if (existingPick[key]) initial[`${g}_${pos}`] = existingPick[key]
      }
    }
    return initial
  })

  const [advancingThird, setAdvancingThird] = useState<string[]>(
    existingPick?.advancing_third ?? []
  )

  const [knockoutPicks, setKnockoutPicks] = useState<Record<string, string[]>>(() => ({
    r32: existingPick?.r32_picks ?? [],
    r16: existingPick?.r16_picks ?? [],
    qf:  existingPick?.qf_picks ?? [],
    sf:  existingPick?.sf_picks ?? [],
  }))

  const [champion, setChampion] = useState<string>(existingPick?.champion ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeStep, setActiveStep] = useState<'groups' | 'third' | 'knockout'>('groups')

  function getTeamsForGroup(groupId: string) {
    return teams.filter(t => t.group_id === groupId)
  }

  function getTeamById(id: string) {
    return teams.find(t => t.id === id)
  }

  function setGroupPick(groupName: string, position: string, teamId: string) {
    setGroupPicks(prev => {
      const updated = { ...prev }
      // Remove this team from other positions in same group
      for (const pos of ['1st', '2nd', '3rd']) {
        if (pos !== position && updated[`${groupName}_${pos}`] === teamId) {
          delete updated[`${groupName}_${pos}`]
        }
      }
      updated[`${groupName}_${position}`] = teamId
      return updated
    })
  }

  function toggleAdvancingThird(teamId: string) {
    setAdvancingThird(prev => {
      if (prev.includes(teamId)) return prev.filter(id => id !== teamId)
      if (prev.length >= 8) return prev
      return [...prev, teamId]
    })
  }

  function allThirdPlacePicks() {
    return ['A','B','C','D','E','F','G','H','I','J','K','L']
      .map(g => groupPicks[`${g}_3rd`])
      .filter(Boolean)
  }

  function setKnockoutPick(round: string, index: number, teamId: string) {
    setKnockoutPicks(prev => {
      const updated = [...(prev[round] ?? [])]
      updated[index] = teamId
      return { ...prev, [round]: updated }
    })
  }

  function getR32Teams(): string[] {
    const firsts = ['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => groupPicks[`${g}_1st`]).filter(Boolean)
    const seconds = ['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => groupPicks[`${g}_2nd`]).filter(Boolean)
    return [...firsts, ...seconds, ...advancingThird]
  }

  function getPrevRoundWinners(round: string): string[] {
    if (round === 'r32') return getR32Teams()
    if (round === 'r16') return knockoutPicks.r32 ?? []
    if (round === 'qf')  return knockoutPicks.r16 ?? []
    if (round === 'sf')  return knockoutPicks.qf ?? []
    return []
  }

  function groupStageComplete() {
    for (const g of ['A','B','C','D','E','F','G','H','I','J','K','L']) {
      if (!groupPicks[`${g}_1st`] || !groupPicks[`${g}_2nd`] || !groupPicks[`${g}_3rd`]) return false
    }
    return true
  }

  async function handleSave() {
    if (!isLoggedIn || locked) return
    setSaving(true)

    const payload: Record<string, any> = {}
    for (const g of ['A','B','C','D','E','F','G','H','I','J','K','L']) {
      const gLower = g.toLowerCase()
      payload[`group_${gLower}_1st`] = groupPicks[`${g}_1st`] ?? null
      payload[`group_${gLower}_2nd`] = groupPicks[`${g}_2nd`] ?? null
      payload[`group_${gLower}_3rd`] = groupPicks[`${g}_3rd`] ?? null
    }
    payload.advancing_third = advancingThird
    payload.r32_picks = knockoutPicks.r32 ?? []
    payload.r16_picks = knockoutPicks.r16 ?? []
    payload.qf_picks  = knockoutPicks.qf ?? []
    payload.sf_picks  = knockoutPicks.sf ?? []
    payload.champion  = champion ?? null

    const res = await fetch('/api/bracket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const stepStyle = (step: string) => ({
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500 as const,
    cursor: 'pointer',
    border: activeStep === step ? '0.5px solid #00E8E4' : '0.5px solid var(--border-strong)',
    background: activeStep === step ? 'rgba(0,232,228,0.12)' : 'rgba(255,255,255,0.05)',
    color: activeStep === step ? '#00E8E4' : 'var(--muted)',
    transition: 'all 0.15s',
  })

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>
          My Bracket
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
          {locked ? 'Bracket locked — tournament has started' : 'Locks June 11 at 3:00 PM ET · Pick your entire tournament'}
        </div>
      </div>

      {!isLoggedIn && (
        <div style={{ background: 'rgba(0,232,228,0.07)', border: '0.5px solid rgba(0,232,228,0.18)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Sign in to fill out your bracket</div>
          <a href="/auth" style={{ fontSize: '13px', fontWeight: 500, color: '#00E8E4', textDecoration: 'none', padding: '6px 14px', border: '0.5px solid rgba(0,232,228,0.4)', borderRadius: '8px', background: 'rgba(0,232,228,0.1)' }}>Sign in</a>
        </div>
      )}

      {/* Step tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button style={stepStyle('groups')} onClick={() => setActiveStep('groups')}>1. Group Stage</button>
        <button style={stepStyle('third')} onClick={() => setActiveStep('third')}>2. Advancing 3rd Place</button>
        <button style={stepStyle('knockout')} onClick={() => setActiveStep('knockout')}>3. Knockout Bracket</button>
      </div>

      {/* STEP 1 — Group stage */}
      {activeStep === 'groups' && (
        <div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
            For each group pick who finishes 1st, 2nd, and 3rd. You cannot pick the same team twice in the same group.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {groups.map(group => {
              const groupTeams = getTeamsForGroup(group.id)
              return (
                <div key={group.id} style={{ background: 'rgba(255,255,255,0.06)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', marginBottom: '10px' }}>
                    Group {group.name}
                  </div>
                  {(['1st', '2nd', '3rd'] as const).map(pos => {
                    const currentPick = groupPicks[`${group.name}_${pos}`]
                    const pickedTeam = currentPick ? getTeamById(currentPick) : null
                    return (
                      <div key={pos} style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{pos}</div>
                        <select
                          disabled={locked || !isLoggedIn}
                          value={currentPick ?? ''}
                          onChange={e => setGroupPick(group.name, pos, e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '0.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
                        >
                          <option value="" style={{ background: '#0d1220' }}>Select team...</option>
                          {groupTeams.map(t => (
                            <option key={t.id} value={t.id} style={{ background: '#0d1220' }}>
                              {t.flag_emoji} {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setActiveStep('third')}
              disabled={!groupStageComplete()}
              style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: groupStageComplete() ? 'pointer' : 'not-allowed', border: 'none', background: groupStageComplete() ? '#00E8E4' : 'rgba(255,255,255,0.1)', color: groupStageComplete() ? '#0a0e1a' : 'var(--muted)' }}
            >
              Next: Pick advancing 3rd place teams
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Advancing third place */}
      {activeStep === 'third' && (
        <div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
            Pick 8 of your 12 third-place teams that you think will advance to the Round of 32.
          </div>
          <div style={{ fontSize: '12px', color: advancingThird.length === 8 ? '#4ade80' : '#00E8E4', marginBottom: '16px', fontWeight: 500 }}>
            {advancingThird.length}/8 selected
          </div>

          {allThirdPlacePicks().length < 12 && (
            <div style={{ fontSize: '12px', color: '#fbbf24', marginBottom: '12px', padding: '8px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', border: '0.5px solid rgba(245,158,11,0.3)' }}>
              Complete all group stage 3rd place picks first
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => {
              const teamId = groupPicks[`${g}_3rd`]
              if (!teamId) return (
                <div key={g} style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', fontSize: '12px', color: 'var(--dim)' }}>
                  Group {g} — no 3rd place pick yet
                </div>
              )
              const team = getTeamById(teamId)
              if (!team) return null
              const isSelected = advancingThird.includes(teamId)
              const isDisabled = !isSelected && advancingThird.length >= 8
              return (
                <div
                  key={g}
                  onClick={() => !locked && isLoggedIn && !isDisabled && toggleAdvancingThird(teamId)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: isSelected ? '0.5px solid #00E8E4' : '0.5px solid rgba(255,255,255,0.1)',
                    background: isSelected ? 'rgba(0,232,228,0.10)' : 'rgba(255,255,255,0.05)',
                    cursor: locked || !isLoggedIn || isDisabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: isDisabled ? 0.4 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--muted)', width: '52px' }}>Group {g} 3rd</span>
                    <span style={{ fontSize: '16px' }}>{team.flag_emoji}</span>
                    <span style={{ fontSize: '13px', color: '#fff' }}>{team.name}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: isSelected ? '#00E8E4' : 'var(--muted)', fontWeight: 500 }}>
                    {isSelected ? 'Advances' : 'Eliminated'}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setActiveStep('knockout')}
              disabled={advancingThird.length !== 8}
              style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: advancingThird.length === 8 ? 'pointer' : 'not-allowed', border: 'none', background: advancingThird.length === 8 ? '#00E8E4' : 'rgba(255,255,255,0.1)', color: advancingThird.length === 8 ? '#0a0e1a' : 'var(--muted)' }}
            >
              Next: Fill out knockout bracket
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Knockout bracket */}
      {activeStep === 'knockout' && (
        <div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
            Pick who advances through each knockout round all the way to the champion.
          </div>

          {KNOCKOUT_ROUNDS.map(round => {
            const available = getPrevRoundWinners(round.key)
            const currentPicks = knockoutPicks[round.key] ?? []
            return (
              <div key={round.key} style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 500, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
                  {round.label}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Array.from({ length: round.slots }).map((_, i) => {
                    const currentPick = currentPicks[i]
                    const pickedTeam = currentPick ? getTeamById(currentPick) : null
                    return (
                      <div key={i}>
                        <select
                          disabled={locked || !isLoggedIn}
                          value={currentPick ?? ''}
                          onChange={e => setKnockoutPick(round.key, i, e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '8px', border: '0.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
                        >
                          <option value="" style={{ background: '#0d1220' }}>Pick winner {i + 1}...</option>
                          {available.map(teamId => {
                            const t = getTeamById(teamId)
                            if (!t) return null
                            return (
                              <option key={t.id} value={t.id} style={{ background: '#0d1220' }}>
                                {t.flag_emoji} {t.name}
                              </option>
                            )
                          })}
                        </select>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Champion pick */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
              World Cup Champion
            </div>
            <select
              disabled={locked || !isLoggedIn}
              value={champion}
              onChange={e => setChampion(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: champion ? '0.5px solid rgba(0,232,228,0.4)' : '0.5px solid rgba(255,255,255,0.2)', background: champion ? 'rgba(0,232,228,0.08)' : 'rgba(255,255,255,0.07)', color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}
            >
              <option value="" style={{ background: '#0d1220' }}>Select your champion...</option>
              {(knockoutPicks.sf ?? []).map(teamId => {
                const t = getTeamById(teamId)
                if (!t) return null
                return (
                  <option key={t.id} value={t.id} style={{ background: '#0d1220' }}>
                    {t.flag_emoji} {t.name}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Save button */}
          {isLoggedIn && !locked && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none', background: saved ? 'rgba(74,222,128,0.2)' : '#00E8E4', color: saved ? '#4ade80' : '#0a0e1a', transition: 'all 0.15s' }}
            >
              {saving ? 'Saving...' : saved ? 'Bracket saved!' : 'Save my bracket'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}