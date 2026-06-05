import type { BroadcasterUS } from '@/types'

/**
 * US broadcast rights for the 2026 World Cup.
 * Fox Sports and Telemundo hold the rights.
 *
 * General rules (update with actual schedule when confirmed):
 * - FOX: marquee games, knockouts
 * - FS1: non-marquee group stage
 * - Telemundo: Spanish-language simulcast of major games
 * - Peacock: streaming simulcast for select games
 *
 * This map is keyed by fixture_id from Supabase.
 * Seed it once the fixture IDs are established.
 * Falls back to defaults based on stage if no entry found.
 */
export const BROADCASTER_MAP: Record<string, BroadcasterUS[]> = {
  // Populated after seeding fixtures — example entries:
  // 'fixture-uuid-here': ['FOX', 'Telemundo'],
}

/** Default broadcasters by stage when no specific entry exists */
export function getBroadcasters(
  fixtureId: string,
  stage: string
): BroadcasterUS[] {
  if (BROADCASTER_MAP[fixtureId]) {
    return BROADCASTER_MAP[fixtureId]
  }

  // Default fallback by stage
  switch (stage) {
    case 'final':
      return ['FOX', 'Telemundo']
    case 'sf':
    case 'qf':
      return ['FOX', 'FS1']
    case 'r16':
    case 'r32':
      return ['FOX', 'FS1']
    case 'group':
    default:
      return ['FS1']
  }
}

/** Pill color config per broadcaster */
export const BROADCASTER_STYLES: Record<
  BroadcasterUS,
  { bg: string; text: string; border: string; label: string }
> = {
  FOX: {
    bg: 'rgba(12,68,124,0.3)',
    text: '#85b7eb',
    border: 'rgba(55,138,221,0.3)',
    label: 'FOX',
  },
  FS1: {
    bg: 'rgba(12,68,124,0.25)',
    text: '#7eb3e8',
    border: 'rgba(55,138,221,0.25)',
    label: 'FS1',
  },
  Telemundo: {
    bg: 'rgba(113,43,19,0.3)',
    text: '#f0997b',
    border: 'rgba(216,90,48,0.3)',
    label: 'Tele',
  },
  Peacock: {
    bg: 'rgba(99,153,34,0.2)',
    text: '#97c459',
    border: 'rgba(99,153,34,0.25)',
    label: 'Peacock',
  },
  fuboTV: {
    bg: 'rgba(99,153,34,0.2)',
    text: '#97c459',
    border: 'rgba(99,153,34,0.25)',
    label: 'fubo',
  },
}
