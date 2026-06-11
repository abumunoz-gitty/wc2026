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

const LOCK_TIME = new Date('2026-06-11T19:00:00Z')

function isLocked() {
  return new Date() >= LOCK_TIME
}

interface Slot {
  type: 'winner' | 'runner_up' | 'best_third'
  group?: string
  groups?: string[]
}

const R32_MATCHUPS: { a: Slot; b: Slot }[] = [
  { a: { type: 'runner_up', group: 'A' }, b: { type: 'runner_up', group: 'B' } },
  { a: { type: 'winner',    group: 'E' }, b: { type: 'best_third', groups: ['A','B','C','D','F'] } },
  { a: { type: 'winner',    group: 'F' }, b: { type: 'runner_up',  group: 'C' } },
  { a: { type: 'winner',    group: 'C' }, b: { type: 'runner_up',  group: 'F' } },
  { a: { type: 'winner',    group: 'I' }, b: { type: 'best_third', groups: ['C','D','F','G','H'] } },
  { a: { type: 'runner_up', group: 'E' }, b: { type: 'runner_up',  group: 'I' } },
  { a: { type: 'winner',    group: 'A' }, b: { type: 'best_third', groups: ['C','E','F','H','I'] } },
  { a: { type: 'winner',    group: 'L' }, b: { type: 'best_third', groups: ['E','H','I','J','K'] } },
  { a: { type: 'winner',    group: 'D' }, b: { type: 'best_third', groups: ['B','E','F','I','J'] } },
  { a: { type: 'winner',    group: 'G' }, b: { type: 'best_third', groups: ['A','E','H','I','J'] } },
  { a: { type: 'runner_up', group: 'K' }, b: { type: 'runner_up',  group: 'L' } },
  { a: { type: 'winner',    group: 'H' }, b: { type: 'runner_up',  group: 'J' } },
  { a: { type: 'winner',    group: 'B' }, b: { type: 'best_third', groups: ['E','F','G','I','J'] } },
  { a: { type: 'winner',    group: 'J' }, b: { type: 'runner_up',  group: 'H' } },
  { a: { type: 'winner',    group: 'K' }, b: { type: 'best_third', groups: ['D','E','I','J','L'] } },
  { a: { type: 'runner_up', group: 'D' }, b: { type: 'runner_up',  group: 'G' } },
]

function resolveSlot(
  slot: Slot,
  groupPicks: Record<string, string>,
  advancingThird: string[],
  teams: Team[]
): Team | undefined {
  if (slot.type === 'winner') {
    const teamId = groupPicks[`${slot.group}_1st`]
    return teamId ? teams.find(t => t.id === teamId) : undefined
  }
  if (slot.type === 'runner_up') {
    const teamId = groupPicks[`${slot.group}_2nd`]
    return teamId ? teams.find(t => t.id === teamId) : undefined
  }
  if (slot.type === 'best_third' && slot.groups) {
    for (const g of slot.groups) {
      const thirdId = groupPicks[`${g}_3rd`]
      if (thirdId && advancingThird.includes(thirdId)) {
        return teams.find(t => t.id === thirdId)
      }
    }
  }
  return undefined
}

function slotLabel(slot: Slot): string {
  if (slot.type === 'winner')     return `Winner Group ${slot.group}`
  if (slot.type === 'runner_up')  return `Runner-up Group ${slot.group}`
  if (slot.type === 'best_third') return `Best 3rd (${slot.groups?.join('/')})`
  return 'TBD'
}

function BracketRound({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{
        fontSize: '11px', fontWeight: 500, color: '#fff',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: '10px', paddingBottom: '8px',
        borderBottom: '0.5px solid rgba(255,255,255,0.1)',
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </div>
  )
}

function TeamSlot({
  label, team, isWinner, isLoser, locked, onPick
}: {
  label: string
  team?: Team
  isWinner: boolean
  isLoser: boolean
  locked: boolean
  onPick: () => void
}) {
  return (
    <div
      onClick={() => !locked && onPick()}
      style={{
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: locked ? 'default' : 'pointer',
        background: isWinner ? 'rgba(0,232,228,0.10)' : 'transparent',
        opacity: isLoser ? 0.35 : 1,
        transition: 'background 0.15s',
      }}
    >
      {team ? (
        <>
          <span style={{ fontSize: '18px', lineHeight: 1 }}>{team.flag_emoji}</span>
          <span style={{ fontSize: '13px', color: isWinner ? '#fff' : '#8b95b0', fontWeight: isWinner ? 600 : 400, flex: 1 }}>
            {team.name}
          </span>
          {isWinner && <span style={{ fontSize: '10px', color: '#00E8E4', fontWeight: 500 }}>Advances</span>}
        </>
      ) : (
        <span style={{ fontSize: '12px', color: 'var(--dim)', flex: 1 }}>{label}</span>
      )}
    </div>
  )
}

function MatchupCard({
  matchNum, slotA, slotB, teamA, teamB, winner, locked, onPick, isFinal
}: {
  matchNum: number
  slotA: string
  slotB: string
  teamA?: Team
  teamB?: Team
  winner?: string
  locked: boolean
  onPick: (teamId: string) => void
  isFinal?: boolean
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: isFinal ? '0.5px solid rgba(0,232,228,0.3)' : '0.5px solid rgba(255,255,255,0.1)',
      borderRadius: '10px',
      overflow: 'hidden',
    }}>
      <div style={{
        fontSize: '9px', color: 'var(--dim)', padding: '4px 10px',
        borderBottom: '0.5px solid rgba(255,255,255,0.05)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        Match {matchNum}
      </div>
      <TeamSlot
        label={slotA}
        team={teamA}
        isWinner={!!(winner && winner === teamA?.id)}
        isLoser={!!(winner && winner !== teamA?.id)}
        locked={locked || !teamA}
        onPick={() => teamA && onPick(teamA.id)}
      />
      <div style={{ height: '0.5px', background: 'rgba(255,255,255,0.06)' }} />
      <TeamSlot
        label={slotB}
        team={teamB}
        isWinner={!!(winner && winner === teamB?.id)}
        isLoser={!!(winner && winner !== teamB?.id)}
        locked={locked || !teamB}
        onPick={() => teamB && onPick(teamB.id)}
      />
    </div>
  )
}

export function BracketPicksClient({ teams, groups, existingPick, isLoggedIn }: Props) {
  const locked = isLocked()

  const [groupPicks, setGroupPicks] = useState<Record<string, string>>(() => {
    if (!existingPick) return {}
    const initial: Record<string, string> = {}
    for (const g of ['A','B','C','D','E','F','G','H','I','J','K','L']) {
      const gL = g.toLowerCase()
      if (existingPick[`group_${gL}_1st`]) initial[`${g}_1st`] = existingPick[`group_${gL}_1st`]
      if (existingPick[`group_${gL}_2nd`]) initial[`${g}_2nd`] = existingPick[`group_${gL}_2nd`]
      if (existingPick[`group_${gL}_3rd`]) initial[`${g}_3rd`] = existingPick[`group_${gL}_3rd`]
    }
    return initial
  })

  const [advancingThird, setAdvancingThird] = useState<string[]>(
    existingPick?.advancing_third ?? []
  )

  const [r32Picks, setR32Picks]   = useState<string[]>(existingPick?.r32_picks ?? [])
  const [r16Picks, setR16Picks]   = useState<string[]>(existingPick?.r16_picks ?? [])
  const [qfPicks,  setQfPicks]    = useState<string[]>(existingPick?.qf_picks  ?? [])
  const [sfPicks,  setSfPicks]    = useState<string[]>(existingPick?.sf_picks  ?? [])
  const [champion, setChampion]   = useState<string>(existingPick?.champion ?? '')

  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [activeStep, setActiveStep] = useState<'groups' | 'third' | 'knockout'>('groups')

  function getTeamById(id: string) {
    return teams.find(t => t.id === id)
  }

  function getTeamsForGroup(groupId: string) {
    return teams.filter(t => t.group_id === groupId)
  }

  function setGroupPick(groupName: string, position: string, teamId: string) {
    setGroupPicks(prev => {
      const updated = { ...prev }
      for (const pos of ['1st','2nd','3rd']) {
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

  function setKnockoutPick(round: string, index: number, teamId: string) {
    if (round === 'r32') setR32Picks(prev => { const u = [...prev]; u[index] = teamId; return u })
    if (round === 'r16') setR16Picks(prev => { const u = [...prev]; u[index] = teamId; return u })
    if (round === 'qf')  setQfPicks(prev  => { const u = [...prev]; u[index] = teamId; return u })
    if (round === 'sf')  setSfPicks(prev  => { const u = [...prev]; u[index] = teamId; return u })
  }

  function allThirdPlacePicks() {
    return ['A','B','C','D','E','F','G','H','I','J','K','L']
      .map(g => groupPicks[`${g}_3rd`])
      .filter(Boolean)
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
      const gL = g.toLowerCase()
      payload[`group_${gL}_1st`] = groupPicks[`${g}_1st`] ?? null
      payload[`group_${gL}_2nd`] = groupPicks[`${g}_2nd`] ?? null
      payload[`group_${gL}_3rd`] = groupPicks[`${g}_3rd`] ?? null
    }
    payload.advancing_third = advancingThird
    payload.r32_picks = r32Picks
    payload.r16_picks = r16Picks
    payload.qf_picks  = qfPicks
    payload.sf_picks  = sfPicks
    payload.champion  = champion || null
    payload.locked = false

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

  const stepBtn = (step: 'groups' | 'third' | 'knockout', label: string) => (
    <button
      onClick={() => setActiveStep(step)}
      style={{
        padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
        cursor: 'pointer',
        border: activeStep === step ? '0.5px solid #00E8E4' : '0.5px solid var(--border-strong)',
        background: activeStep === step ? 'rgba(0,232,228,0.12)' : 'rgba(255,255,255,0.05)',
        color: activeStep === step ? '#00E8E4' : 'var(--muted)',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )

  const nextBtn = (onClick: () => void, disabled: boolean, label: string) => (
    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
          cursor: disabled ? 'not-allowed' : 'pointer', border: 'none',
          background: disabled ? 'rgba(255,255,255,0.1)' : '#00E8E4',
          color: disabled ? 'var(--muted)' : '#0a0e1a',
        }}
      >
        {label}
      </button>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>
          My Bracket
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
          {locked
            ? 'Bracket locked — tournament has started'
            : 'Locks June 11 at 3:00 PM ET · Pick your entire tournament'}
        </div>
      </div>

      {!isLoggedIn && (
        <div style={{
          background: 'rgba(0,232,228,0.07)', border: '0.5px solid rgba(0,232,228,0.18)',
          borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Sign in to fill out your bracket</div>
          <a href="/auth" style={{
            fontSize: '13px', fontWeight: 500, color: '#00E8E4', textDecoration: 'none',
            padding: '6px 14px', border: '0.5px solid rgba(0,232,228,0.4)',
            borderRadius: '8px', background: 'rgba(0,232,228,0.1)',
          }}>Sign in</a>
        </div>
      )}

      {/* Step tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {stepBtn('groups',   '1. Group Stage')}
        {stepBtn('third',    '2. Advancing 3rd Place')}
        {stepBtn('knockout', '3. Knockout Bracket')}
      </div>

      {/* ── STEP 1 ── Group stage picks */}
      {activeStep === 'groups' && (
        <div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
            For each group pick who finishes 1st, 2nd, and 3rd. You cannot pick the same team twice in the same group.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {groups.map(group => {
              const groupTeams = getTeamsForGroup(group.id)
              return (
                <div key={group.id} style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '0.5px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', padding: '14px',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff', marginBottom: '10px' }}>
                    Group {group.name}
                  </div>
                  {(['1st','2nd','3rd'] as const).map(pos => {
                    const currentPick = groupPicks[`${group.name}_${pos}`]
                    return (
                      <div key={pos} style={{ marginBottom: '8px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{pos}</div>
                        <select
                          disabled={locked || !isLoggedIn}
                          value={currentPick ?? ''}
                          onChange={e => setGroupPick(group.name, pos, e.target.value)}
                          style={{
                            width: '100%', padding: '6px 10px', borderRadius: '8px',
                            border: '0.5px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.07)', color: '#fff',
                            fontSize: '12px', cursor: 'pointer',
                          }}
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
          {nextBtn(() => setActiveStep('third'), !groupStageComplete(), 'Next: Pick advancing 3rd place teams')}
        </div>
      )}

      {/* ── STEP 2 ── Advancing third place */}
      {activeStep === 'third' && (
        <div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '8px' }}>
            Pick 8 of your 12 third-place teams that you think will advance to the Round of 32.
          </div>
          <div style={{
            fontSize: '12px', fontWeight: 500, marginBottom: '16px',
            color: advancingThird.length === 8 ? '#4ade80' : '#00E8E4',
          }}>
            {advancingThird.length}/8 selected
          </div>

          {allThirdPlacePicks().length < 12 && (
            <div style={{
              fontSize: '12px', color: '#fbbf24', marginBottom: '12px',
              padding: '8px 12px', background: 'rgba(245,158,11,0.1)',
              borderRadius: '8px', border: '0.5px solid rgba(245,158,11,0.3)',
            }}>
              Complete all group stage 3rd place picks first
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['A','B','C','D','E','F','G','H','I','J','K','L'].map(g => {
              const teamId = groupPicks[`${g}_3rd`]
              if (!teamId) return (
                <div key={g} style={{
                  padding: '10px 14px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '0.5px solid rgba(255,255,255,0.06)',
                  fontSize: '12px', color: 'var(--dim)',
                }}>
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
                    padding: '10px 14px', borderRadius: '8px',
                    border: isSelected ? '0.5px solid #00E8E4' : '0.5px solid rgba(255,255,255,0.1)',
                    background: isSelected ? 'rgba(0,232,228,0.10)' : 'rgba(255,255,255,0.05)',
                    cursor: locked || !isLoggedIn || isDisabled ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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
          {nextBtn(() => setActiveStep('knockout'), advancingThird.length !== 8, 'Next: Fill out knockout bracket')}
        </div>
      )}

      {/* ── STEP 3 ── Knockout bracket */}
      {activeStep === 'knockout' && (
        <div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
            Click a team to pick them as the winner of each matchup. Your picks cascade through the bracket automatically.
          </div>

          {/* Round of 32 */}
          <BracketRound label="Round of 32">
            {R32_MATCHUPS.map((matchup, i) => {
              const teamA = resolveSlot(matchup.a, groupPicks, advancingThird, teams)
              const teamB = resolveSlot(matchup.b, groupPicks, advancingThird, teams)
              return (
                <MatchupCard
                  key={i}
                  matchNum={73 + i}
                  slotA={slotLabel(matchup.a)}
                  slotB={slotLabel(matchup.b)}
                  teamA={teamA}
                  teamB={teamB}
                  winner={r32Picks[i]}
                  locked={locked || !isLoggedIn}
                  onPick={(teamId) => setKnockoutPick('r32', i, teamId)}
                />
              )
            })}
          </BracketRound>

          {/* Round of 16 */}
          <BracketRound label="Round of 16">
            {Array.from({ length: 8 }).map((_, i) => {
              const teamA = r32Picks[i * 2]     ? getTeamById(r32Picks[i * 2])     : undefined
              const teamB = r32Picks[i * 2 + 1] ? getTeamById(r32Picks[i * 2 + 1]) : undefined
              return (
                <MatchupCard
                  key={i}
                  matchNum={89 + i}
                  slotA={`Winner Match ${73 + i * 2}`}
                  slotB={`Winner Match ${74 + i * 2}`}
                  teamA={teamA}
                  teamB={teamB}
                  winner={r16Picks[i]}
                  locked={locked || !isLoggedIn}
                  onPick={(teamId) => setKnockoutPick('r16', i, teamId)}
                />
              )
            })}
          </BracketRound>

          {/* Quarterfinals */}
          <BracketRound label="Quarterfinals">
            {Array.from({ length: 4 }).map((_, i) => {
              const teamA = r16Picks[i * 2]     ? getTeamById(r16Picks[i * 2])     : undefined
              const teamB = r16Picks[i * 2 + 1] ? getTeamById(r16Picks[i * 2 + 1]) : undefined
              return (
                <MatchupCard
                  key={i}
                  matchNum={97 + i}
                  slotA={`Winner R16 Match ${i * 2 + 1}`}
                  slotB={`Winner R16 Match ${i * 2 + 2}`}
                  teamA={teamA}
                  teamB={teamB}
                  winner={qfPicks[i]}
                  locked={locked || !isLoggedIn}
                  onPick={(teamId) => setKnockoutPick('qf', i, teamId)}
                />
              )
            })}
          </BracketRound>

          {/* Semifinals */}
          <BracketRound label="Semifinals">
            {Array.from({ length: 2 }).map((_, i) => {
              const teamA = qfPicks[i * 2]     ? getTeamById(qfPicks[i * 2])     : undefined
              const teamB = qfPicks[i * 2 + 1] ? getTeamById(qfPicks[i * 2 + 1]) : undefined
              return (
                <MatchupCard
                  key={i}
                  matchNum={101 + i}
                  slotA={`Winner QF Match ${i * 2 + 1}`}
                  slotB={`Winner QF Match ${i * 2 + 2}`}
                  teamA={teamA}
                  teamB={teamB}
                  winner={sfPicks[i]}
                  locked={locked || !isLoggedIn}
                  onPick={(teamId) => setKnockoutPick('sf', i, teamId)}
                />
              )
            })}
          </BracketRound>

          {/* Final */}
          <BracketRound label="Final — July 19, MetLife Stadium">
            <MatchupCard
              matchNum={104}
              slotA="Winner Semifinal 1"
              slotB="Winner Semifinal 2"
              teamA={sfPicks[0] ? getTeamById(sfPicks[0]) : undefined}
              teamB={sfPicks[1] ? getTeamById(sfPicks[1]) : undefined}
              winner={champion}
              locked={locked || !isLoggedIn}
              onPick={(teamId) => setChampion(teamId)}
              isFinal
            />
          </BracketRound>

          {champion && (
            <div style={{
              margin: '20px 0', padding: '16px',
              background: 'rgba(0,232,228,0.08)',
              border: '0.5px solid rgba(0,232,228,0.3)',
              borderRadius: '12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Your World Cup Champion
              </div>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{getTeamById(champion)?.flag_emoji}</div>
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#00E8E4' }}>{getTeamById(champion)?.name}</div>
            </div>
          )}

          {isLoggedIn && !locked && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer', border: 'none',
                background: saved ? 'rgba(74,222,128,0.2)' : '#00E8E4',
                color: saved ? '#4ade80' : '#0a0e1a',
                transition: 'all 0.15s',
              }}
            >
              {saving ? 'Saving...' : saved ? 'Bracket saved!' : 'Save my bracket'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}