<script setup lang="ts">
import { CloudOffIcon } from '@lucide/vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import StatePanel from '@/components/StatePanel.vue';
import { Button } from '@/components/ui/button';
import { errorMessageKey, type Player } from '@/shared/api';
import { formatRiotId, headlineRank, PLATFORM_CODES, type RankedQueue } from '@/shared/riot';
import LpHistory from './LpHistory.vue';
import MasteryList from './MasteryList.vue';
import ProfileHeader from './ProfileHeader.vue';
import ProfileSkeleton from './ProfileSkeleton.vue';
import RankCard from './RankCard.vue';
import { awaitingFirstSync, syncFinished } from './sync';
import { useLivePlayer } from './useLivePlayer';
import { usePlayerProfile } from './usePlayerProfile';
import { useRankHistory } from './useRankHistory';

const props = defineProps<{ puuid: string; player: Player }>();

const { t } = useI18n();
const { profile, error, isPending, retry, refresh, isRefreshing } = usePlayerProfile(
  () => props.puuid,
);
useLivePlayer(
  () => props.puuid,
  () => profile.value?.sync.status === 'syncing',
);

const placeholder = computed(() => !profile.value || awaitingFirstSync(profile.value.sync));
const ranks = computed(() => profile.value?.ranks ?? []);
const solo = computed(() => ranks.value.find((rank) => rank.queue === 'solo'));
const flex = computed(() => ranks.value.find((rank) => rank.queue === 'flex'));
const headline = computed(() => headlineRank(ranks.value));

const chosenQueue = ref<RankedQueue>();
// Opens on Flex for players who only play Flex instead of an empty Solo graph.
const historyQueue = computed<RankedQueue>({
  get: () => chosenQueue.value ?? (!solo.value && flex.value ? 'flex' : 'solo'),
  // A single-select toggle group emits undefined when its active item is clicked again.
  set: (queue: RankedQueue | undefined) => {
    if (queue) chosenQueue.value = queue;
  },
});
// Waits for the profile: the default queue depends on which queues the player is ranked in.
const history = useRankHistory(
  () => props.puuid,
  () => historyQueue.value,
  () => !placeholder.value,
);

const announcement = ref('');
watch(
  () => profile.value?.sync,
  (next, previous) => {
    if (next && syncFinished(previous, next)) announcement.value = t('player.sync.done');
  },
);
</script>

<template>
  <div :data-tier="headline?.tier" class="flex flex-col gap-8">
    <ProfileHeader
      :player="profile ?? player"
      :rank="headline"
      :rank-pending="placeholder"
      :refreshing="isRefreshing"
      :can-refresh="!(error && !profile)"
      @refresh="refresh"
    />

    <StatePanel
      v-if="error && !profile"
      tone="error"
      :title="t('player.error.sections')"
      :description="t(errorMessageKey(error))"
    >
      <template #icon><CloudOffIcon /></template>
      <Button @click="retry">{{ t('player.error.retry') }}</Button>
    </StatePanel>

    <ProfileSkeleton
      v-else-if="isPending"
      :label="
        t('player.lookingUp', {
          riotId: formatRiotId(player),
          region: PLATFORM_CODES[player.platform],
        })
      "
      :header="false"
    />

    <!-- grid-cols-1 is minmax(0, 1fr): an implicit auto column grows to the rank row's min-content. -->
    <div
      v-else
      class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-8"
    >
      <div class="grid grid-cols-1 content-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <RankCard queue="solo" :rank="solo" :placeholder="placeholder" />
        <RankCard queue="flex" :rank="flex" :placeholder="placeholder" />
      </div>
      <div class="flex min-w-0 flex-col gap-6">
        <LpHistory
          v-model:queue="historyQueue"
          :items="history.items.value"
          :loading="history.isPending.value"
          :ranked="(historyQueue === 'solo' ? solo : flex) !== undefined"
        />
        <MasteryList :masteries="profile?.topMasteries ?? []" :placeholder="placeholder" />
      </div>
    </div>

    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
  </div>
</template>
