import { useQuery } from '@tanstack/vue-query';
import { computed, type MaybeRefOrGetter, reactive, toValue } from 'vue';
import { apiErrorCode, ErrorCode, errorMessageKey } from '@/shared/api';
import { fetchTimeline } from './timeline';

// Shared because every component on the match page reads the same query, but only one runs it.
const preparingMatches = reactive(new Set<string>());

export function useMatchTimeline(matchId: MaybeRefOrGetter<string>) {
  const query = useQuery(
    computed(() => {
      const id = toValue(matchId);
      return {
        queryKey: ['matches', id, 'timeline'] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          fetchTimeline(id, { signal, onPending: () => preparingMatches.add(id) }),
        staleTime: Infinity,
        // A 503 means the Riot job failed and retrying queues another; only lost requests repeat.
        retry: (failures: number, error: unknown) =>
          failures < 2 && errorMessageKey(error) === 'errors.NETWORK',
      };
    }),
  );

  return {
    timeline: query.data,
    error: query.error,
    preparing: computed(
      () => preparingMatches.has(toValue(matchId)) && !query.data.value && !query.error.value,
    ),
    isUnavailable: computed(
      () => apiErrorCode(query.error.value) === ErrorCode.TIMELINE_UNAVAILABLE,
    ),
    retry: () => {
      preparingMatches.delete(toValue(matchId));
      return query.refetch();
    },
  };
}
