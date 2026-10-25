import { type Query, useQueryClient } from '@tanstack/vue-query';
import { type MaybeRefOrGetter, toValue, watchEffect } from 'vue';
import { playerChannel } from '@/shared/realtime/player-channel';

/** Matches every generated query for this player: profile, rank history, and later matches. */
export function isPlayerQuery(query: Pick<Query, 'queryKey'>, puuid: string): boolean {
  const [head] = query.queryKey as [{ path?: { puuid?: unknown } } | undefined];
  return head?.path?.puuid === puuid;
}

export function useLivePlayer(puuid: MaybeRefOrGetter<string>, isSyncing: () => boolean): void {
  const queryClient = useQueryClient();

  watchEffect((onCleanup) => {
    const id = toValue(puuid);
    const refetch = () =>
      void queryClient.invalidateQueries({ predicate: (query) => isPlayerQuery(query, id) });
    onCleanup(
      playerChannel().subscribe(id, {
        onUpdated: refetch,
        // A sync that finished before the room was joined sent its event to nobody; data shown
        // as syncing (cached or fetched in parallel with the join) would never settle.
        onJoined: (afterReconnect) => {
          if (afterReconnect || isSyncing()) refetch();
        },
      }),
    );
  });
}
