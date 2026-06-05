import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS for server-side writes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const WC2026_LEAGUE_ID = 1 // API-Football league ID for 2026 WC
const WC2026_SEASON   = 2026

export async function POST(request: Request) {
  // Protect with secret so only Vercel cron can call this
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if any games are currently live — save API calls if not
    const { data: liveFixtures } = await supabase
      .from('fixtures')
      .select('id, api_football_id')
      .eq('status', 'live')
      .limit(1)

    const { data: soonFixtures } = await supabase
      .from('fixtures')
      .select('id')
      .eq('status', 'scheduled')
      .lte('kickoff_et', new Date(Date.now() + 10 * 60 * 1000).toISOString()) // within 10 min
      .limit(1)

    if (!liveFixtures?.length && !soonFixtures?.length) {
      return NextResponse.json({ message: 'No live or imminent games — skipping sync' })
    }

    // Fetch live fixtures from API-Football
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${WC2026_LEAGUE_ID}&season=${WC2026_SEASON}&live=all`,
      {
        headers: {
          'x-rapidapi-key': process.env.API_FOOTBALL_KEY!,
          'x-rapidapi-host': 'v3.football.api-sports.io',
        },
        next: { revalidate: 0 },
      }
    )

    if (!res.ok) {
      throw new Error(`API-Football error: ${res.status}`)
    }

    const data = await res.json()
    const fixtures = data.response ?? []

    let updated = 0

    for (const f of fixtures) {
      const homeScore = f.goals?.home ?? null
      const awayScore = f.goals?.away ?? null
      const status = mapStatus(f.fixture?.status?.short)

      const { error } = await supabase
        .from('fixtures')
        .update({ home_score: homeScore, away_score: awayScore, status })
        .eq('api_football_id', f.fixture.id)

      if (!error) updated++
    }

    // Also check for just-finished games and trigger scoring
    if (fixtures.some((f: any) => mapStatus(f.fixture?.status?.short) === 'finished')) {
      await triggerScoring()
    }

    return NextResponse.json({ message: `Synced ${updated} fixtures` })
  } catch (err) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

function mapStatus(apiStatus: string): string {
  switch (apiStatus) {
    case '1H': case '2H': case 'HT': case 'ET': case 'P': return 'live'
    case 'FT': case 'AET': case 'PEN':                      return 'finished'
    case 'PST': case 'CANC': case 'ABD':                    return 'postponed'
    default:                                                  return 'scheduled'
  }
}

async function triggerScoring() {
  // Find finished fixtures with ungraded picks
  const { data: ungraded } = await supabase
    .from('fixtures')
    .select('id, home_score, away_score, stage')
    .eq('status', 'finished')
    .not('home_score', 'is', null)

  if (!ungraded?.length) return

  for (const fixture of ungraded) {
    const { data: picks } = await supabase
      .from('picks')
      .select('id, pred_home_score, pred_away_score')
      .eq('fixture_id', fixture.id)
      .is('points_earned', null)

    if (!picks?.length) continue

    for (const pick of picks) {
      const { grade } = await import('@/lib/scoring')
      const result = grade(
        { pred_home_score: pick.pred_home_score, pred_away_score: pick.pred_away_score },
        { home_score: fixture.home_score!, away_score: fixture.away_score!, stage: fixture.stage }
      )

      await supabase
        .from('picks')
        .update({ points_earned: result.points, locked: true })
        .eq('id', pick.id)
    }
  }
}

// GET handler for manual testing
export async function GET() {
  return NextResponse.json({ message: 'Use POST with cron secret' })
}
