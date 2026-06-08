import { createServerSupabaseClient } from '@/lib/supabase'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export const revalidate = 60

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const now = new Date().toISOString()

  const { data: upcomingFixtures } = await supabase
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
    .eq('status', 'scheduled')
    .gte('kickoff_et', now)
    .order('kickoff_et', { ascending: true })
    .limit(8)

  const { data: liveFixtures } = await supabase
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
    .eq('status', 'live')
    .order('kickoff_et', { ascending: true })

  const { data: recentFixtures } = await supabase
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
    .eq('status', 'finished')
    .order('kickoff_et', { ascending: false })
    .limit(4)

  const { data: { user } } = await supabase.auth.getUser()

  let userStats = null
  let userPicks: any[] = []
  let followedTeamIds: string[] = []

  if (user) {
    const { data: stats } = await supabase
      .from('users')
      .select('total_points, display_name')
      .eq('id', user.id)
      .single()

    const { data: picks } = await supabase
      .from('picks')
      .select('*')
      .eq('user_id', user.id)

    const { data: followed } = await supabase
      .from('followed_teams')
      .select('team_id')
      .eq('user_id', user.id)

    userStats = stats
    userPicks = picks ?? []
    followedTeamIds = (followed ?? []).map((f: any) => f.team_id)
  }

  return (
    <DashboardClient
      upcomingFixtures={(upcomingFixtures ?? []) as any}
      liveFixtures={(liveFixtures ?? []) as any}
      recentFixtures={(recentFixtures ?? []) as any}
      userStats={userStats}
      userPicks={userPicks}
      isLoggedIn={!!user}
      followedTeamIds={followedTeamIds}
    />
  )
}
