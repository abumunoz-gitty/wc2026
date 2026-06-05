import { createServerSupabaseClient } from '@/lib/supabase'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export const revalidate = 60

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const tomorrowEnd = new Date(now)
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 2)
  tomorrowEnd.setHours(23, 59, 59, 999)

  const { data: fixtures } = await supabase
    .from('fixtures')
    .select(`
      *,
      home_team:teams!fixtures_home_team_id_fkey(*),
      away_team:teams!fixtures_away_team_id_fkey(*)
    `)
    .gte('kickoff_et', todayStart.toISOString())
    .lte('kickoff_et', tomorrowEnd.toISOString())
    .order('kickoff_et', { ascending: true })

  const { data: liveFixtures } = await supabase
    .from('fixtures')
    .select(`
      *,
      home_team:teams!fixtures_home_team_id_fkey(*),
      away_team:teams!fixtures_away_team_id_fkey(*)
    `)
    .eq('status', 'live')
    .order('kickoff_et', { ascending: true })

  const { data: { user } } = await supabase.auth.getUser()

  let userStats = null
  let userPicks: any[] = []

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

    userStats = stats
    userPicks = picks ?? []
  }

  const allFixtures = [
    ...(liveFixtures ?? []),
    ...(fixtures ?? []).filter(f => f.status !== 'live'),
  ]

  return (
    <DashboardClient
      fixtures={allFixtures}
      userStats={userStats}
      userPicks={userPicks}
      isLoggedIn={!!user}
    />
  )
}