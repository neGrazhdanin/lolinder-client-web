import type { RouteLocationRaw } from 'vue-router';
import type { Match, MatchParticipant } from '@/shared/api';
import { isPlatform, type MatchResult, matchResult, riotIdToSlug } from '@/shared/riot';

export const BLUE_SIDE = 100;

export interface SideTotals {
  kills: number;
  deaths: number;
  assists: number;
  goldEarned: number;
  damageToChampions: number;
}

export interface MatchSide {
  /** teamId in team modes, the duo's subteamId in Arena */
  id: number;
  teamId: number;
  placement: number | null;
  result: MatchResult;
  players: MatchParticipant[];
  totals: SideTotals;
}

export function isArena(match: Pick<Match, 'participants'>): boolean {
  return match.participants.some((participant) => participant.subteamId !== null);
}

export function sideTotals(players: readonly MatchParticipant[]): SideTotals {
  const totals: SideTotals = {
    kills: 0,
    deaths: 0,
    assists: 0,
    goldEarned: 0,
    damageToChampions: 0,
  };
  for (const player of players) {
    for (const key of Object.keys(totals) as (keyof SideTotals)[]) totals[key] += player[key];
  }
  return totals;
}

// Arena's teamId only splits the top four duos from the bottom four, so duos group by subteam.
export function matchSides(match: Pick<Match, 'participants' | 'remake'>): MatchSide[] {
  const arena = isArena(match);
  const groups = new Map<number, MatchParticipant[]>();
  for (const participant of match.participants) {
    const id = arena ? (participant.subteamId ?? participant.teamId) : participant.teamId;
    const group = groups.get(id);
    if (group) group.push(participant);
    else groups.set(id, [participant]);
  }

  const sides = [...groups].map(([id, players]): MatchSide => {
    const placement = arena
      ? (players.find((player) => player.placement !== null)?.placement ?? null)
      : null;
    return {
      id,
      teamId: players[0]!.teamId,
      placement,
      result: matchResult({
        win: players.some((player) => player.win),
        remake: match.remake,
      }),
      players,
      totals: sideTotals(players),
    };
  });

  return sides.sort((a, b) =>
    arena
      ? (a.placement ?? Infinity) - (b.placement ?? Infinity) || a.id - b.id
      : a.teamId - b.teamId,
  );
}

export function maxDamage(match: Pick<Match, 'participants'>): number {
  return Math.max(0, ...match.participants.map((participant) => participant.damageToChampions));
}

export function viewedParticipant(
  match: Pick<Match, 'participants'>,
  puuid: string | undefined,
): MatchParticipant | undefined {
  return puuid ? match.participants.find((participant) => participant.puuid === puuid) : undefined;
}

export function playerLink(
  locale: string,
  platform: string,
  { gameName, tagLine }: Pick<MatchParticipant, 'gameName' | 'tagLine'>,
): RouteLocationRaw | null {
  if (!gameName || !tagLine || !isPlatform(platform)) return null;
  return {
    name: 'player',
    params: { locale, platform, riotId: riotIdToSlug({ gameName, tagLine }) },
  };
}
