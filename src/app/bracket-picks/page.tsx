import { createServerSupabaseClient } from '@/lib/supabase'
import { BracketPicksClient } from '@/components/bracket/BracketPicksClient'

export const revalidate = 0

export default async function BracketPicksPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, flag_emoji, country_code, group_id')
    .order('name', { ascending: true })

  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .order('name', { ascending: true })

  let existingPick = null
  if (user) {
    const { data } = await supabase
      .from('bracket_picks')
      .select('*')
      .eq('user_id', user.id)
      .single()
    existingPick = data
  }

  return (
    <BracketPicksClient
      teams={(teams ?? []) as any}
      groups={groups ?? []}
      existingPick={existingPick}
      isLoggedIn={!!user}
    />
  )
}