import { useQuery } from '@tanstack/vue-query';
import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue';
import { type Platform, apiErrorCode, ErrorCode, errorMessageKey } from '@/shared/api';
import type { RiotId } from '@/shared/riot';
import { lookupPlayer } from './lookup';

export interface PlayerLookupTarget {
  platform: Platform;
  riotId: RiotId;
}

/** Riot IDs are case-insensitive, so the key is too: `faker#kr1` and `Faker#KR1` share a cache entry. */
export function playerLookupKey({ platform, riotId }: PlayerLookupTarget) {
  return [
    'players',
    'lookup',
    platform,
    riotId.gameName.toLowerCase(),
    riotId.tagLine.toLowerCase(),
  ] as const;
}

export function usePlayerLookup(target: MaybeRefOrGetter<PlayerLookupTarget | null>) {
  const stillLooking = ref(false);
  watch(
    () => {
      const value = toValue(target);
      return value && playerLookupKey(value).join('\u0000');
    },
    () => (stillLooking.value = false),
  );

  const query = useQuery(
    computed(() => {
      const value = toValue(target);
      return {
        queryKey: value ? playerLookupKey(value) : (['players', 'lookup', null] as const),
        queryFn: ({ signal }: { signal: AbortSignal }) => {
          if (!value) throw new Error('lookup without a target');
          return lookupPlayer(
            { platform: value.platform, ...value.riotId },
            { signal, onPending: () => (stillLooking.value = true) },
          );
        },
        enabled: value !== null,
        staleTime: 5 * 60_000,
        // Not retryTransient: a 503 here means the Riot lookup job failed, and retrying queues a
        // new job that spends Riot budget again. Only requests that never arrived are repeated.
        retry: (failures: number, error: unknown) =>
          failures < 2 && errorMessageKey(error) === 'errors.NETWORK',
      };
    }),
  );

  return {
    player: query.data,
    error: query.error,
    isNotFound: computed(() => apiErrorCode(query.error.value) === ErrorCode.PLAYER_NOT_FOUND),
    stillLooking,
    retry: () => query.refetch(),
  };
}
