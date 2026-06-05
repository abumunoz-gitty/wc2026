import { format, formatDistanceToNow, isPast, differenceInMinutes } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

const ET_ZONE = 'America/New_York'

/** Format a UTC ISO string for display in Eastern Time */
export function formatKickoffET(isoString: string): string {
  const date = toZonedTime(new Date(isoString), ET_ZONE)
  return format(date, 'h:mm a') + ' ET'
}

/** Format date label like "Sun Jun 15" */
export function formatDateLabel(isoString: string): string {
  const date = toZonedTime(new Date(isoString), ET_ZONE)
  return format(date, 'EEE MMM d')
}

/** Format full date + time: "Sun Jun 15 · 3:00 PM ET" */
export function formatFullDateTime(isoString: string): string {
  const date = toZonedTime(new Date(isoString), ET_ZONE)
  return format(date, 'EEE MMM d · h:mm a') + ' ET'
}

/** Countdown string: "in 2 hours", "in 45 minutes", etc. */
export function formatCountdown(isoString: string): string {
  const kickoff = new Date(isoString)
  if (isPast(kickoff)) return 'started'
  return formatDistanceToNow(kickoff, { addSuffix: true })
}

/** Minutes until kickoff (negative if past) */
export function minutesUntilKickoff(isoString: string): number {
  return differenceInMinutes(new Date(isoString), new Date())
}

/** Group fixtures by date string "Mon Jun 16" */
export function groupByDate<T extends { kickoff_et: string }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce(
    (acc, item) => {
      const key = formatDateLabel(item.kickoff_et)
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    },
    {} as Record<string, T[]>
  )
}
