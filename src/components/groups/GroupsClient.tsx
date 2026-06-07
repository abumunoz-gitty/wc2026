'use client'

import type { Group, Team } from '@/types'

interface FinishedFixture {
  id: string
  home_team_id: string
  away_team_id: string
  home_score: number
  away_score: number
  stage: string
  status: string
}

interface TeamStanding {
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
}

interface Props {
  groups: Group[]
  teams: Team[]
  fixtures: FinishedFixture[]
}

export function GroupsClient({ groups, teams, fixtures }: Props) {

  function getStandingsForGroup(groupId: string): TeamStanding[] {
    const groupTeams = teams.filter(t => t.group_id === groupId)

    const standings: TeamStanding[] = groupTeams.map(team => ({
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
    }))

    for (const fixture of fixtures) {
      const home = standings.find(s => s.team.id === fixture.home_team_id)
      const away = standings.find(s => s.team.id === fixture.away_team_id)
      if (!home || !away) continue

      const hs = fixture.home_score
      const as_ = fixture.away_score

      home.played++
      away.played++
      home.gf += hs
      home.ga += as_
      away.gf += as_
      away.ga += hs

      if (hs > as_) {
        home.won++; home.points += 3
        away.lost++
      } else if (hs < as_) {
        away.won++; away.points += 3
        home.lost++
      } else {
        home.drawn++; home.points++
        away.drawn++; away.points++
      }
    }

    return standings
      .map(s => ({ ...s, gd: s.gf - s.ga }))
      .sort((a, b) =>
        b.points - a.points ||
        b.gd - a.gd ||
        b.gf - a.gf
      )
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '22px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>
          Group standings
        </div>
        <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
          Top 2 + 8 best 3rd place teams advance
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
      }}>
        {groups.map((group, groupIndex) => {
          const standings = getStandingsForGroup(group.id)
          return (
            <div
              key={group.id}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '14px',
              }}
            >
              <div style={{
                fontSize: '13px',
                fontWeight: 500,
                color: '#fff',
                marginBottom: '12px',
              }}>
                Group {group.name}
              </div>

              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 28px 28px 28px 28px 28px',
                gap: '4px',
                marginBottom: '6px',
                paddingBottom: '6px',
                borderBottom: '0.5px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>Team</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textAlign: 'center' }}>P</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textAlign: 'center' }}>W</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textAlign: 'center' }}>D</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textAlign: 'center' }}>L</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', textAlign: 'center' }}>Pts</div>
              </div>

              {/* Team rows */}
              {standings.map((s, index) => (
                <div
                  key={s.team.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 28px 28px 28px 28px 28px',
                    gap: '4px',
                    padding: '6px 0',
                    borderBottom: index < standings.length - 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none',
                    borderLeft: index < 2 ? '2px solid rgba(74,222,128,0.5)' : 'none',
                    paddingLeft: index < 2 ? '6px' : '0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>{s.team.flag_emoji}</span>
                    <span style={{ fontSize: '12px', color: '#fff' }}>{s.team.name}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>{s.played}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>{s.won}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>{s.drawn}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>{s.lost}</div>
                  <div style={{ fontSize: '12px', color: '#fff', textAlign: 'center', fontWeight: 500 }}>{s.points}</div>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}