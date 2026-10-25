import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue-sonner';
import {
  errorMessageKey,
  playersControllerProfileOptions,
  playersControllerRefreshMutation,
  retryTransient,
} from '@/shared/api';
import { refreshWasQueued } from './sync';

export function usePlayerProfile(puuid: MaybeRefOrGetter<string>) {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const options = computed(() =>
    playersControllerProfileOptions({ path: { puuid: toValue(puuid) } }),
  );
  const query = useQuery(computed(() => ({ ...options.value, retry: retryTransient })));

  const refresh = useMutation({
    ...playersControllerRefreshMutation(),
    onSuccess: (profile) => {
      // A player:updated refetch can land before a slow refresh response; keep the newer data.
      const cached = queryClient.getQueryData(options.value.queryKey);
      const newer = (cached?.sync.lastSyncedAt ?? '') > (profile.sync.lastSyncedAt ?? '');
      if (!newer) queryClient.setQueryData(options.value.queryKey, profile);
      if (!refreshWasQueued(profile.sync)) toast(t('player.refresh.upToDate'));
    },
    onError: (error) => {
      toast.error(t('player.refresh.failed'), { description: t(errorMessageKey(error)) });
    },
  });

  return {
    profile: query.data,
    error: query.error,
    isPending: query.isPending,
    retry: () => query.refetch(),
    refresh: () => refresh.mutate({ path: { puuid: toValue(puuid) } }),
    isRefreshing: refresh.isPending,
  };
}
