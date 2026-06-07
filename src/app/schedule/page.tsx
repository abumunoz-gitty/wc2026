import { createServerSupabaseClient } from '@/lib/supabase'
import { ScheduleClient } from '@/components/schedule/ScheduleClient'

export const revalidate = 60

export default async function SchedulePage() {
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
      broadcasters_us,
      venue,
      group_id,
      group_name,
      home_team:teams!fixtures_home_team_id_fkey(*),
      away_team:teams!fixtures_away_team_id_fkey(*)
    `)
    .order('kickoff_et', { ascending: true })

  return <ScheduleClient fixtures={(fixtures ?? []) as any} />
}