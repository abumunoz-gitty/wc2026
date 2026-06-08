'use client'

import { useState } from 'react'
import type { Fixture } from '@/types'
import { formatKickoffET, formatDateLabel } from '@/lib/dates'

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
  fixtures: Fixture[]
  followedTeamIds: string[]
  isLoggedIn: boolean
}

export function TeamsClient({ teams, groups, fixtures, followedTeamIds, isLoggedIn }: Props) {
  const [followed, setFollowed] = useState<string[]>(followedTeamIds)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function toggleFollow(teamId: string) {
    if (!isLoggedIn) return
    setLoadingId(teamId)
    const isFollowing = followed.includes(teamId)
    const res = await fetch('/api/teams/follow', {
      method: isFollowing ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_id: teamId }),
    })
    if (res.ok) {
      setFollowed(prev =>
        isFollowing ? prev.filter(id => id !== teamId) : [...prev, teamId]
      )
    }
    setLoadingId(null)
  }

  function getTeamFixtures(teamId: string) {
    return fixtures.filter(f =>
      (f.home_team as any)?.id === teamId ||
      (f.away_team as any)?.id === teamId
    )
  }

  function getGroupName(groupId: string) {
    return groups.find(g => g.id === groupId)?.name ?? ''
  }

  const followedTeams = teams.filter(t => followed.includes(t.id))
  const otherTeams = teams.filter(t => !followed.includes(t.id))

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>
          Teams
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
          {isLoggedIn ? `Following ${followed.length} teams` : 'Sign in to follow teams'}
        </div>
      </div>

      {!isLoggedIn && (
        <div style={{
          background: 'rgba(0,232,228,0.07)', border: '0.5px solid rgba(0,232,228,0.18)',
          borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '14px', color: 'var(--muted)' }}>Sign in to follow teams</div>
          <a href="/auth" style={{
            fontSize: '13px', fontWeight: 500, color: '#00E8E4', textDecoration: 'none',
            padding: '6px 14px', border: '0.5px solid rgba(0,232,228,0.4)',
            borderRadius: '8px', background: 'rgba(0,232,228,0.1)',
          }}>Sign in</a>
        </div>
      )}

      {/* Following section */}
      {followedTeams.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            fontSize: '11px', fontWeight: 500, color: '#fff',
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px',
          }}>
            Following
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {followedTeams.map(team => (
              <TeamRow
                key={team.id}
                team={team}
                isFollowed={true}
                isLoading={loadingId === team.id}
                isLoggedIn={isLoggedIn}
                onFollow={() => toggleFollow(team.id)}
                onSelect={() => setSelectedTeam(team)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All teams */}
      <div>
        <div style={{
          fontSize: '11px', fontWeight: 500, color: '#fff',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px',
        }}>
          All teams
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {otherTeams.map(team => (
            <TeamRow
              key={team.id}
              team={team}
              isFollowed={false}
              isLoading={loadingId === team.id}
              isLoggedIn={isLoggedIn}
              onFollow={() => toggleFollow(team.id)}
              onSelect={() => setSelectedTeam(team)}
            />
          ))}
        </div>
      </div>

      {/* Team detail modal */}
      {selectedTeam && (
        <TeamModal
          team={selectedTeam}
          fixtures={getTeamFixtures(selectedTeam.id)}
          groupName={getGroupName(selectedTeam.group_id)}
          isFollowed={followed.includes(selectedTeam.id)}
          isLoggedIn={isLoggedIn}
          isLoading={loadingId === selectedTeam.id}
          onFollow={() => toggleFollow(selectedTeam.id)}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  )
}

function TeamRow({
  team, isFollowed, isLoading, isLoggedIn, onFollow, onSelect
}: {
  team: Team
  isFollowed: boolean
  isLoading: boolean
  isLoggedIn: boolean
  onFollow: () => void
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 14px', borderRadius: '10px',
        background: isFollowed
          ? 'rgba(0,232,228,0.06)'
          : hovered
          ? 'rgba(0,232,228,0.07)'
          : 'rgba(255,255,255,0.05)',
        border: isFollowed
          ? '0.5px solid rgba(0,232,228,0.2)'
          : hovered
          ? '0.5px solid rgba(0,232,228,0.25)'
          : '0.5px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <div
        onClick={onSelect}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}
      >
        <span style={{ fontSize: '24px', lineHeight: 1 }}>{team.flag_emoji}</span>
        <span style={{
          fontSize: '14px',
          color: hovered || isFollowed ? '#fff' : '#8b95b0',
          fontWeight: isFollowed ? 500 : 400,
          transition: 'color 0.15s',
        }}>
          {team.name}
        </span>
      </div>

      {isLoggedIn && (
        <button
          onClick={e => { e.stopPropagation(); onFollow() }}
          disabled={isLoading}
          style={{
            padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 500,
            cursor: 'pointer',
            border: isFollowed ? '0.5px solid rgba(0,232,228,0.4)' : '0.5px solid rgba(255,255,255,0.2)',
            background: isFollowed ? 'rgba(0,232,228,0.12)' : 'rgba(255,255,255,0.07)',
            color: isFollowed ? '#00E8E4' : 'var(--muted)',
            transition: 'all 0.15s',
          }}
        >
          {isLoading ? '...' : isFollowed ? 'Following' : 'Follow'}
        </button>
      )}
    </div>
  )
}

function TeamModal({
  team, fixtures, groupName, isFollowed, isLoggedIn, isLoading, onFollow, onClose
}: {
  team: Team
  fixtures: Fixture[]
  groupName: string
  isFollowed: boolean
  isLoggedIn: boolean
  isLoading: boolean
  onFollow: () => void
  onClose: () => void
}) {
  const upcoming = fixtures.filter(f => f.status === 'scheduled')
  const finished = fixtures.filter(f => f.status === 'finished')
  const live = fixtures.filter(f => f.status === 'live')

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 100,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#0d1220',
        border: '0.5px solid rgba(255,255,255,0.18)',
        borderRadius: '16px',
        padding: '24px 20px',
        zIndex: 101,
        maxHeight: '80vh',
        overflowY: 'auto',
        width: '90%',
        maxWidth: '520px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              borderRadius: '50%',
              width: '28px', height: '28px',
              cursor: 'pointer',
              color: 'var(--muted)',
              fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            x
          </button>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <span style={{ fontSize: '40px', lineHeight: 1 }}>{team.flag_emoji}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '20px', fontWeight: 500, color: '#fff' }}>{team.name}</div>
            <div style={{ fontSize: '13px', color: 'var(--muted)' }}>Group {groupName}</div>
          </div>
          {isLoggedIn && (
            <button
              onClick={onFollow}
              disabled={isLoading}
              style={{
                padding: '7px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
                cursor: 'pointer',
                border: isFollowed ? '0.5px solid rgba(0,232,228,0.4)' : '0.5px solid rgba(255,255,255,0.2)',
                background: isFollowed ? 'rgba(0,232,228,0.12)' : 'rgba(255,255,255,0.07)',
                color: isFollowed ? '#00E8E4' : '#fff',
              }}
            >
              {isLoading ? '...' : isFollowed ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {/* Live */}
        {live.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <SectionLabel>Live now</SectionLabel>
            {live.map(f => <FixtureRow key={f.id} fixture={f} teamId={team.id} />)}
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <SectionLabel>Upcoming</SectionLabel>
            {upcoming.map(f => <FixtureRow key={f.id} fixture={f} teamId={team.id} />)}
          </div>
        )}

        {/* Results */}
        {finished.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <SectionLabel>Results</SectionLabel>
            {finished.map(f => <FixtureRow key={f.id} fixture={f} teamId={team.id} />)}
          </div>
        )}

        {fixtures.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)', fontSize: '13px' }}>
            No fixtures yet
          </div>
        )}
      </div>
    </>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 500, color: 'var(--muted)',
      textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px',
    }}>
      {children}
    </div>
  )
}

function FixtureRow({ fixture, teamId }: { fixture: Fixture; teamId: string }) {
  const home = fixture.home_team as any
  const away = fixture.away_team as any
  const isHome = home?.id === teamId
  const isFinished = fixture.status === 'finished'
  const isLive = fixture.status === 'live'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 12px', borderRadius: '8px', marginBottom: '6px',
      background: 'rgba(255,255,255,0.05)',
      border: '0.5px solid rgba(255,255,255,0.08)',
    }}>
      <span style={{ fontSize: '16px' }}>{home?.flag_emoji}</span>
      <span style={{ fontSize: '12px', color: '#fff', flex: 1 }}>
        {home?.name} vs {away?.name}
      </span>

      {isFinished && fixture.home_score !== null ? (
        <span style={{ fontSize: '12px', fontWeight: 500, color: '#fff' }}>
          {fixture.home_score} - {fixture.away_score}
        </span>
      ) : isLive ? (
        <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 500 }}>Live</span>
      ) : (
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
          {formatDateLabel(fixture.kickoff_et)} {formatKickoffET(fixture.kickoff_et)}
        </span>
      )}
    </div>
  )
}