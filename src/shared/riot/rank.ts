import type { PlayerRank } from '@/shared/api';

export type Tier = PlayerRank['tier'];
export type Division = PlayerRank['division'];
export type RankedQueue = PlayerRank['queue'];
export type RankPosition = Pick<PlayerRank, 'tier' | 'division' | 'leaguePoints'>;

export const TIERS: readonly Tier[] = [
  'IRON',
  'BRONZE',
  'SILVER',
  'GOLD',
  'PLATINUM',
  'EMERALD',
  'DIAMOND',
  'MASTER',
  'GRANDMASTER',
  'CHALLENGER',
];

const DIVISIONS: readonly Division[] = ['IV', 'III', 'II', 'I'];
const DIVISION_SPAN = 100;
const TIER_SPAN = DIVISIONS.length * DIVISION_SPAN;
const APEX_FLOOR = TIERS.indexOf('MASTER') * TIER_SPAN;

export function isApexTier(tier: Tier): boolean {
  return tier === 'MASTER' || tier === 'GRANDMASTER' || tier === 'CHALLENGER';
}

/**
 * One continuous scale for the whole ladder, so a promotion reads as going up.
 * Apex tiers share one LP pool: Riot moves players between them by LP and seat count.
 */
export function ladderPoints({ tier, division, leaguePoints }: RankPosition): number {
  if (isApexTier(tier)) return APEX_FLOOR + leaguePoints;
  return (
    TIERS.indexOf(tier) * TIER_SPAN + DIVISIONS.indexOf(division) * DIVISION_SPAN + leaguePoints
  );
}

export interface LadderStep {
  points: number;
  tier: Tier;
  division: Division | null;
}

/** Division floors inside [min, max], bottom first; apex tiers contribute only the Master floor. */
export function ladderSteps(min: number, max: number): LadderStep[] {
  const steps: LadderStep[] = [];
  const first = Math.max(0, Math.ceil(min / DIVISION_SPAN) * DIVISION_SPAN);
  for (let points = first; points <= Math.min(max, APEX_FLOOR); points += DIVISION_SPAN) {
    if (points === APEX_FLOOR) {
      steps.push({ points, tier: 'MASTER', division: null });
      break;
    }
    const tier = TIERS[Math.floor(points / TIER_SPAN)];
    const division = DIVISIONS[(points % TIER_SPAN) / DIVISION_SPAN];
    if (tier && division) steps.push({ points, tier, division });
  }
  return steps;
}

/** The next division up, or null in apex tiers where LP has no ceiling. */
export function nextStep({ tier, division }: Pick<RankPosition, 'tier' | 'division'>) {
  if (isApexTier(tier)) return null;
  const divisionIndex = DIVISIONS.indexOf(division);
  if (divisionIndex < DIVISIONS.length - 1) {
    return { tier, division: DIVISIONS[divisionIndex + 1] ?? null };
  }
  const next = TIERS[TIERS.indexOf(tier) + 1] ?? 'MASTER';
  return { tier: next, division: isApexTier(next) ? null : ('IV' as Division) };
}

export function winRate(wins: number, losses: number): number | null {
  const games = wins + losses;
  return games === 0 ? null : wins / games;
}

/** The rank that should tint the page: Solo/Duo first, Flex when Solo/Duo is unranked. */
export function headlineRank<T extends Pick<PlayerRank, 'queue'>>(ranks: readonly T[]): T | null {
  return (
    ranks.find((rank) => rank.queue === 'solo') ??
    ranks.find((rank) => rank.queue === 'flex') ??
    null
  );
}
