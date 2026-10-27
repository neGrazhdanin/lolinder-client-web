import type { MatchHistoryItem, MatchHistoryPage, MatchHistoryParticipant } from '@/shared/api';

export type MatchResult = 'win' | 'loss' | 'remake';

export function matchResult(match: Pick<MatchHistoryItem, 'win' | 'remake'>): MatchResult {
  if (match.remake) return 'remake';
  return match.win ? 'win' : 'loss';
}

export function kdaRatio({
  kills,
  deaths,
  assists,
}: Pick<MatchHistoryItem, 'kills' | 'deaths' | 'assists'>): number | null {
  return deaths === 0 ? null : (kills + assists) / deaths;
}

export function csPerMinute({ cs, durationSec }: Pick<MatchHistoryItem, 'cs' | 'durationSec'>) {
  return durationSec > 0 ? cs / (durationSec / 60) : 0;
}

// In Arena teamId only splits the top four duos from the bottom four; the duo is the subteam.
export function teamsOf(participants: readonly MatchHistoryParticipant[]) {
  const teams = new Map<number, MatchHistoryParticipant[]>();
  for (const participant of participants) {
    const id = participant.subteamId ?? participant.teamId;
    const team = teams.get(id);
    if (team) team.push(participant);
    else teams.set(id, [participant]);
  }
  return [...teams.values()];
}

export interface RecentForm {
  wins: number;
  losses: number;
  results: ('win' | 'loss')[];
}

export function recentForm(items: readonly MatchHistoryItem[], size = 20): RecentForm {
  const results = items
    .filter((item) => !item.remake)
    .slice(0, size)
    .map((item): 'win' | 'loss' => (item.win ? 'win' : 'loss'))
    .reverse();
  const wins = results.filter((result) => result === 'win').length;
  return { wins, losses: results.length - wins, results };
}

export interface MatchListState {
  items: MatchHistoryItem[];
  awaitingFirst: boolean;
  checkingNew: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  complete: boolean;
}

export function matchListState(pages: readonly MatchHistoryPage[] | undefined): MatchListState {
  // A refetch after new games shifts page boundaries, so a game can come back on two pages.
  const seen = new Set<string>();
  const items = (pages ?? [])
    .flatMap((page) => page.items)
    .filter((item) => !seen.has(item.matchId) && seen.add(item.matchId));

  const first = pages?.[0];
  const last = pages?.[pages.length - 1];
  if (!first || !last) {
    return {
      items,
      awaitingFirst: false,
      checkingNew: false,
      loadingMore: false,
      hasMore: false,
      complete: false,
    };
  }

  const awaitingFirst = items.length === 0 && (first.loading.newest || last.loading.older);
  return {
    items,
    awaitingFirst,
    checkingNew: first.loading.newest && !awaitingFirst,
    loadingMore: last.loading.older && !awaitingFirst,
    hasMore: last.nextCursor !== null,
    complete: !last.loading.older && last.nextCursor === null && items.length > 0,
  };
}
