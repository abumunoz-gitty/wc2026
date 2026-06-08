import { createServerSupabaseClient } from '@/lib/supabase'
import { TeamsClient } from '@/components/teams/TeamsClient'

export const revalidate = 60

export default async function TeamsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, flag_emoji, country_code, group_id')
    .order('name', { ascending: true })

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name')
    .order('name', { ascending: true })

  const { data: fixtures } = await supabase
    .from('fixtures')
    .select(`
      id,
      kickoff_et,
      stage,
      status,
      home_score,
      away_score,
      broadcasters_us,
      venue,
      group_name,
      home_team:teams!fixtures_home_team_id_fkey(*),
      away_team:teams!fixtures_away_team_id_fkey(*)
    `)
    .order('kickoff_et', { ascending: true })

  let followedTeamIds: string[] = []
  if (user) {
    const { data: followed } = await supabase
      .from('followed_teams')
      .select('team_id')
      .eq('user_id', user.id)
    followedTeamIds = (followed ?? []).map(f => f.team_id)
  }

  return (
    <TeamsClient
      teams={(teams ?? []) as any}
      groups={groups ?? []}
      fixtures={(fixtures ?? []) as any}
      followedTeamIds={followedTeamIds}
      isLoggedIn={!!user}
    />
  )
}