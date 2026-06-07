import { createServerSupabaseClient } from '@/lib/supabase'
import { GroupsClient } from '@/components/groups/GroupsClient'

export const revalidate = 60

export default async function GroupsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .order('name', { ascending: true })

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .order('name', { ascending: true })

  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('*')
    .eq('stage', 'group')
    .eq('status', 'finished')

  return (
    <GroupsClient
      groups={groups ?? []}
      teams={teams ?? []}
      fixtures={fixtures ?? []}
    />
  )
}