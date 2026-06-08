import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json()
  const { award_type, predicted_team_id, predicted_player } = body

  const { data, error } = await supabase
    .from('award_picks')
    .upsert(
      {
        user_id: user.id,
        award_type,
        predicted_team_id: predicted_team_id ?? null,
        predicted_player: predicted_player ?? null,
      },
      { onConflict: 'user_id,award_type' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ pick: data })
}
