import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import { playersControllerRankHistoryOptions, retryTransient } from '@/shared/api';
import type { RankedQueue } from '@/shared/riot';

export function useRankHistory(
  puuid: MaybeRefOrGetter<string>,
  queue: MaybeRefOrGetter<RankedQueue>,
  enabled: MaybeRefOrGetter<boolean>,
) {
  const query = useQuery(
    computed(() => ({
      ...playersControllerRankHistoryOptions({
        path: { puuid: toValue(puuid) },
        query: { queue: toValue(queue) },
      }),
      enabled: toValue(enabled),
      retry: retryTransient,
      // Switching Solo/Flex keeps the previous line on screen instead of flashing the skeleton.
      placeholderData: keepPreviousData,
    })),
  );

  return {
    items: computed(() => query.data.value?.items),
    isPending: query.isPending,
  };
}
