export type Stage =
  | 'group'
  | 'r32'
  | 'r16'
  | 'qf'
  | 'sf'
  | 'third_place'
  | 'final'

export type FixtureStatus = 'scheduled' | 'live' | 'finished' | 'postponed'

export type BroadcasterUS = 'FOX' | 'FS1' | 'Telemundo' | 'Peacock' | 'fuboTV'

export interface Team {
  id: string
  name: string
  country_code: string
  flag_emoji: string
  primary_color: string   // hex — used for glass card tint
  group_id: string
}

export interface Group {
  id: string
  name: string            // 'A' through 'L'
  stage: string
}

export interface GroupStanding {
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  gd: number
  points: number
}

export interface Fixture {
  id: string
  home_team: Team
  away_team: Team
  kickoff_et: string      // ISO string, Eastern Time
  stage: Stage
  home_score: number | null
  away_score: number | null
  status: FixtureStatus
  broadcasters_us: BroadcasterUS[]
  venue: string
  group_id: string | null
}

export interface Pick {
  id: string
  user_id: string
  fixture_id: string
  pred_home_score: number
  pred_away_score: number
  points_earned: number | null
  locked: boolean
  created_at: string
}

export interface AwardPick {
  id: string
  user_id: string
  award_type: AwardType
  predicted_team_id: string | null
  predicted_player: string | null
  points_earned: number | null
}

export type AwardType =
  | 'golden_boot'
  | 'golden_ball'
  | 'golden_glove'
  | 'tournament_winner'

export interface LeaderboardEntry {
  user_id: string
  display_name: string
  avatar_url: string | null
  total_points: number
  exact_scores: number
  correct_results: number
  rank: number
}

export interface User {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  favorite_team_id: string | null
  total_points: number
}

// Scoring result from grade()
export interface ScoreResult {
  points: number
  reason: 'exact_score' | 'correct_result' | 'wrong'
}
