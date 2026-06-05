import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { isPickLocked } from '@/lib/scoring'

// POST /api/picks — submit a pick
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { fixture_id, pred_home_score, pred_away_score } = body

  if (
    typeof fixture_id !== 'string' ||
    typeof pred_home_score !== 'number' ||
    typeof pred_away_score !== 'number' ||
    pred_home_score < 0 || pred_away_score < 0
  ) {
    return NextResponse.json({ error: 'Invalid pick data' }, { status: 400 })
  }

  // Verify fixture exists and isn't locked
  const { data: fixture, error: fErr } = await supabase
    .from('fixtures')
    .select('id, kickoff_et, status')
    .eq('id', fixture_id)
    .single()

  if (fErr || !fixture) {
    return NextResponse.json({ error: 'Fixture not found' }, { status: 404 })
  }

  if (isPickLocked(fixture.kickoff_et) || fixture.status !== 'scheduled') {
    return NextResponse.json({ error: 'Pick window closed' }, { status: 403 })
  }

  // Upsert pick (one per user per fixture)
  const { data, error } = await supabase
    .from('picks')
    .upsert(
      {
        user_id: user.id,
        fixture_id,
        pred_home_score,
        pred_away_score,
        locked: false,
        points_earned: null,
      },
      { onConflict: 'user_id,fixture_id' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pick: data })
}

// GET /api/picks?fixture_id=xxx — get current user's pick for a fixture
export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const fixture_id = searchParams.get('fixture_id')

  const query = supabase
    .from('picks')
    .select('*')
    .eq('user_id', user.id)

  if (fixture_id) {
    query.eq('fixture_id', fixture_id)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ picks: data })
}
