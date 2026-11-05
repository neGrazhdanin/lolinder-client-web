<script setup lang="ts">
import { CloudOffIcon, HourglassIcon } from '@lucide/vue';
import { computed, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import ActivityBars from '@/components/ActivityBars.vue';
import StatePanel from '@/components/StatePanel.vue';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { errorMessageKey, type Match } from '@/shared/api';
import GoldDiffChart from './GoldDiffChart.vue';
import { BLUE_SIDE } from './match-details';
import { useMatchTimeline } from './useMatchTimeline';

const props = defineProps<{ match: Match }>();

const { t } = useI18n();
const titleId = useId();

const { timeline, error, preparing, isUnavailable, retry } = useMatchTimeline(
  () => props.match.matchId,
);

const teamGold = computed(() => {
  const data = timeline.value;
  if (!data) return [];
  const blueSide = new Set(
    props.match.participants
      .filter((participant) => participant.teamId === BLUE_SIDE)
      .map((participant) => participant.participantId),
  );
  return data.frameTimes.map((_, frame) => {
    const totals = { blue: 0, red: 0 };
    for (const participant of data.participants) {
      const gold = participant.gold[frame] ?? 0;
      if (blueSide.has(participant.participantId)) totals.blue += gold;
      else totals.red += gold;
    }
    return totals;
  });
});
</script>

<template>
  <section :aria-labelledby="titleId" class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <h2 :id="titleId" class="text-base font-semibold tracking-tight">
        {{ t('match.timeline.title') }}
      </h2>
      <p
        v-if="!timeline && !error"
        class="inline-flex items-center gap-2 text-xs text-muted-foreground"
        role="status"
      >
        <ActivityBars />
        {{ t(preparing ? 'match.timeline.preparing' : 'match.timeline.loading') }}
      </p>
    </div>

    <template v-if="timeline">
      <GoldDiffChart
        v-if="timeline.goldDiff"
        :frame-times="timeline.frameTimes"
        :gold-diff="timeline.goldDiff"
        :team-gold="teamGold"
      />
    </template>

    <StatePanel
      v-else-if="isUnavailable"
      heading="h3"
      :title="t('match.timeline.unavailable.title')"
      :description="t('match.timeline.unavailable.description')"
      class="rounded-xl bg-card p-5"
    >
      <template #icon><HourglassIcon /></template>
    </StatePanel>

    <StatePanel
      v-else-if="error"
      heading="h3"
      tone="error"
      :title="t('match.timeline.error')"
      :description="t(errorMessageKey(error))"
      class="rounded-xl bg-card p-5"
    >
      <template #icon><CloudOffIcon /></template>
      <Button variant="outline" @click="retry">{{ t('player.error.retry') }}</Button>
    </StatePanel>

    <div v-else class="rounded-xl bg-card p-4 sm:p-5" aria-hidden="true">
      <Skeleton class="h-4 w-32 animate-shimmer skeleton-shimmer" />
      <Skeleton class="mt-4 h-44 w-full animate-shimmer rounded-lg skeleton-shimmer sm:h-56" />
    </div>
  </section>
</template>
