import { keepPreviousData, useInfiniteQuery } from '@tanstack/vue-query';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import {
  type MatchHistoryPage,
  matchesControllerHistoryInfiniteOptions,
  matchesControllerHistoryInfiniteQueryKey,
  retryTransient,
} from '@/shared/api';
import type { MatchQueue } from '@/shared/riot';
import { matchListState } from './match-history';

export function matchHistoryKey(puuid: string) {
  return matchesControllerHistoryInfiniteQueryKey({ path: { puuid } });
}

export function useMatchHistory(
  puuid: MaybeRefOrGetter<string>,
  queue: MaybeRefOrGetter<MatchQueue | undefined>,
) {
  const query = useInfiniteQuery(
    computed(() => {
      const filter = toValue(queue);
      return {
        ...matchesControllerHistoryInfiniteOptions({
          path: { puuid: toValue(puuid) },
          ...(filter && { query: { queue: filter } }),
        }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (page: MatchHistoryPage) => page.nextCursor,
        retry: retryTransient,
        placeholderData: keepPreviousData,
      };
    }),
  );

  const state = computed(() => matchListState(query.data.value?.pages));

  return {
    state,
    isWaiting: computed(
      () =>
        query.data.value?.pages.some((page) => page.loading.newest || page.loading.older) ?? false,
    ),
    error: query.error,
    isPending: query.isPending,
    isPlaceholder: query.isPlaceholderData,
    isLoadingMore: query.isFetchingNextPage,
    loadMoreFailed: query.isFetchNextPageError,
    loadMore: () => query.fetchNextPage(),
    retry: () => query.refetch(),
  };
}
