import { useQuery } from '@tanstack/vue-query';
import { computed, type MaybeRefOrGetter, ref, toValue, watch } from 'vue';
import { apiErrorCode, ErrorCode, errorMessageKey } from '@/shared/api';
import { fetchTimeline } from './timeline';

export function useMatchTimeline(matchId: MaybeRefOrGetter<string>) {
  const preparing = ref(false);
  watch(
    () => toValue(matchId),
    () => (preparing.value = false),
  );

  const query = useQuery(
    computed(() => {
      const id = toValue(matchId);
      return {
        queryKey: ['matches', id, 'timeline'] as const,
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          fetchTimeline(id, { signal, onPending: () => (preparing.value = true) }),
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
    preparing,
    isUnavailable: computed(
      () => apiErrorCode(query.error.value) === ErrorCode.TIMELINE_UNAVAILABLE,
    ),
    retry: () => {
      preparing.value = false;
      return query.refetch();
    },
  };
}
