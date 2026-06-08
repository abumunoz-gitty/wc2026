import { createServerSupabaseClient } from '@/lib/supabase'
import { AwardsClient } from '@/components/awards/AwardsClient'

export const revalidate = 60

export default async function AwardsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: teams } = await supabase
    .from('teams')
    .select('id, name, flag_emoji, country_code')
    .order('name', { ascending: true })

  let userAwardPicks: any[] = []

  if (user) {
    const { data: picks } = await supabase
      .from('award_picks')
      .select('*')
      .eq('user_id', user.id)

    userAwardPicks = picks ?? []
  }

  return (
    <AwardsClient
      teams={teams ?? []}
      userAwardPicks={userAwardPicks}
      isLoggedIn={!!user}
    />
  )
}
