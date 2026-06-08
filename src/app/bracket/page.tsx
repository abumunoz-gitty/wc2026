import { createServerSupabaseClient } from '@/lib/supabase'
import { BracketClient } from '@/components/bracket/BracketClient'

export const revalidate = 60

export default async function BracketPage() {
  const supabase = await createServerSupabaseClient()

  const { data: fixtures } = await supabase
    .from('fixtures')
    .select(`
      id,
      kickoff_et,
      stage,
      status,
      home_score,
      away_score,
      group_name,
      home_team:teams!fixtures_home_team_id_fkey(*),
      away_team:teams!fixtures_away_team_id_fkey(*)
    `)
    .neq('stage', 'group')
    .order('kickoff_et', { ascending: true })

  return <BracketClient fixtures={(fixtures ?? []) as any} />
}