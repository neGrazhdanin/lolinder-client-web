import { type Query, useQueryClient } from '@tanstack/vue-query';
import { type MaybeRefOrGetter, toValue, watchEffect } from 'vue';
import { playerChannel } from '@/shared/realtime/player-channel';
import { matchHistoryKey } from './useMatchHistory';

/** Matches every generated query for this player: profile, rank history and match history. */
export function isPlayerQuery(query: Pick<Query, 'queryKey'>, puuid: string): boolean {
  const [head] = query.queryKey as [{ path?: { puuid?: unknown } } | undefined];
  return head?.path?.puuid === puuid;
}

export interface LivePlayerState {
  isSyncing(): boolean;
  isLoadingMatches(): boolean;
}

export function useLivePlayer(puuid: MaybeRefOrGetter<string>, state: LivePlayerState): void {
  const queryClient = useQueryClient();

  watchEffect((onCleanup) => {
    const id = toValue(puuid);
    // Covers the match history too: after a profile sync the API fetches the newest games.
    const refetch = () =>
      void queryClient.invalidateQueries({ predicate: (query) => isPlayerQuery(query, id) });
    const refetchMatches = () =>
      void queryClient.invalidateQueries({ queryKey: matchHistoryKey(id) });
    onCleanup(
      playerChannel().subscribe(id, {
        onUpdated: refetch,
        onMatchesUpdated: refetchMatches,
        // A job that finished before the room was joined sent its event to nobody; data shown
        // as loading (cached or fetched in parallel with the join) would never settle.
        onJoined: (afterReconnect) => {
          if (afterReconnect || state.isSyncing()) refetch();
          else if (state.isLoadingMatches()) refetchMatches();
        },
      }),
    );
  });
}
