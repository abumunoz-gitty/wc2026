import { createServerSupabaseClient } from '@/lib/supabase'
import { LeaderboardClient } from '@/components/leaderboard/LeaderboardClient'

export const revalidate = 60

export default async function LeaderboardPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: standings } = await supabase
    .from('leaderboard')
    .select('*')
    .order('rank', { ascending: true })

  return (
    <LeaderboardClient
      standings={standings ?? []}
      currentUserId={user?.id ?? null}
    />
  )
}
