export type MatchResult = 'win' | 'loss' | 'remake';

export function matchResult(match: { win: boolean; remake: boolean }): MatchResult {
  if (match.remake) return 'remake';
  return match.win ? 'win' : 'loss';
}

export function kdaRatio({
  kills,
  deaths,
  assists,
}: {
  kills: number;
  deaths: number;
  assists: number;
}): number | null {
  return deaths === 0 ? null : (kills + assists) / deaths;
}

export function csPerMinute({ cs, durationSec }: { cs: number; durationSec: number }): number {
  return durationSec > 0 ? cs / (durationSec / 60) : 0;
}
