import { useQuery } from '@tanstack/vue-query';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import {
  apiErrorCode,
  ErrorCode,
  matchesControllerMatchOptions,
  retryTransient,
} from '@/shared/api';

const MISSING: readonly ErrorCode[] = [ErrorCode.MATCH_NOT_FOUND, ErrorCode.VALIDATION_FAILED];

export function useMatch(matchId: MaybeRefOrGetter<string>) {
  const query = useQuery(
    computed(() => ({
      ...matchesControllerMatchOptions({ path: { matchId: toValue(matchId) } }),
      staleTime: Infinity,
      retry: retryTransient,
    })),
  );

  const errorCode = computed(() => apiErrorCode(query.error.value));

  return {
    match: query.data,
    error: query.error,
    isNotFound: computed(() => errorCode.value !== undefined && MISSING.includes(errorCode.value)),
    retry: () => query.refetch(),
  };
}
