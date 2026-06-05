import type { ScoreResult } from '@/types'

interface PickInput {
  pred_home_score: number
  pred_away_score: number
}

interface ResultInput {
  home_score: number
  away_score: number
  stage: string // knockout stages don't allow draws
}

/**
 * Grade a pick against a final result.
 * Pure function — no side effects, fully testable.
 *
 * Scoring rules:
 *   Correct result + correct score = 3 pts
 *   Correct result only             = 1 pt
 *   Wrong result                    = 0 pts
 *
 * In knockout stages (r32, r16, qf, sf, third_place, final)
 * there are no draws — result is always a winner.
 * The "correct result" check uses the full-time score only
 * (we don't model extra time / pens here, just who won FT).
 */
export function grade(pick: PickInput, result: ResultInput): ScoreResult {
  const actualResult = getResult(result.home_score, result.away_score)
  const predictedResult = getResult(pick.pred_home_score, pick.pred_away_score)

  const exactScore =
    pick.pred_home_score === result.home_score &&
    pick.pred_away_score === result.away_score

  const correctResult = actualResult === predictedResult

  if (exactScore && correctResult) {
    return { points: 3, reason: 'exact_score' }
  }

  if (correctResult) {
    return { points: 1, reason: 'correct_result' }
  }

  return { points: 0, reason: 'wrong' }
}

type Result = 'home' | 'away' | 'draw'

function getResult(home: number, away: number): Result {
  if (home > away) return 'home'
  if (away > home) return 'away'
  return 'draw'
}

/**
 * Whether a pick is still editable.
 * Locks 1 minute before kickoff to account for clock drift.
 */
export function isPickLocked(kickoffEt: string): boolean {
  const kickoff = new Date(kickoffEt)
  const lockTime = new Date(kickoff.getTime() - 60 * 1000) // 1 min before
  return new Date() >= lockTime
}
