/**
 * Primary color per team used for the glass fixture card tint.
 * Home team color bleeds from the left, away from the right.
 * Keyed by country_code (ISO 3166-1 alpha-2 or custom code).
 */
export const TEAM_COLORS: Record<string, string> = {
  // Group A
  US: '#3b82f6', // blue
  CA: '#dc2626', // red
  MA: '#16a34a', // green
  HR: '#1d4ed8', // navy

  // Group B
  AR: '#3b82f6', // light blue
  MX: '#16a34a', // green
  PL: '#dc2626', // red
  SA: '#16a34a', // green

  // Group C
  EN: '#dc2626', // red (England uses custom code)
  SN: '#16a34a', // green
  NL: '#ea580c', // orange
  EC: '#facc15', // yellow

  // Group D
  DE: '#1c1c1c', // black (use dark gray for visibility)
  JP: '#dc2626', // red
  ES: '#dc2626', // red
  AU: '#facc15', // gold

  // Group E
  FR: '#1d4ed8', // blue
  PT: '#16a34a', // green
  KR: '#dc2626', // red
  GH: '#16a34a', // green

  // Group F
  BR: '#16a34a', // green
  NG: '#16a34a', // green
  UY: '#3b82f6', // blue
  RS: '#dc2626', // red

  // Group G
  BE: '#dc2626', // red
  MA2: '#dc2626', // fallback
  CH: '#dc2626', // red (Switzerland)
  CM: '#16a34a', // green

  // Group H
  ENG: '#dc2626',
  GB: '#dc2626',

  // fallback
  DEFAULT: '#6b7280',
}

export function getTeamColor(countryCode: string): string {
  return TEAM_COLORS[countryCode.toUpperCase()] ?? TEAM_COLORS.DEFAULT
}
