import { createServerSupabaseClient } from '@/lib/supabase'
import { PicksClient } from '@/components/picks/PicksClient'

export const revalidate = 0

export default async function PicksPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

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
      group_id,
      group_name,
      home_team:teams!fixtures_home_team_id_fkey(*),
      away_team:teams!fixtures_away_team_id_fkey(*)
    `)
    .order('kickoff_et', { ascending: true })

  let userPicks: any[] = []

  if (user) {
    const { data: picks } = await supabase
      .from('picks')
      .select('*')
      .eq('user_id', user.id)

    userPicks = picks ?? []
  }

  return (
    <PicksClient
      fixtures={(fixtures ?? []) as any}
      userPicks={userPicks}
      isLoggedIn={!!user}
    />
  )
}