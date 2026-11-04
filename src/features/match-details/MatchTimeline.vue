<script setup lang="ts">
import { CloudOffIcon, HourglassIcon } from '@lucide/vue';
import { computed, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ActivityBars from '@/components/ActivityBars.vue';
import ChampionIcon from '@/components/ChampionIcon.vue';
import StatePanel from '@/components/StatePanel.vue';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { errorMessageKey, type Match, type MatchParticipant } from '@/shared/api';
import { formatRiotId } from '@/shared/riot';
import { useStaticData } from '@/shared/static-data';
import BuildOrder from './BuildOrder.vue';
import GoldDiffChart from './GoldDiffChart.vue';
import SkillOrder from './SkillOrder.vue';
import { BLUE_SIDE, type MatchSide } from './match-details';
import { useMatchTimeline } from './useMatchTimeline';

const props = defineProps<{
  match: Match;
  sides: MatchSide[];
  arena: boolean;
  viewedPuuid?: string;
}>();

const { t } = useI18n();
const { lookup } = useStaticData();
const titleId = useId();
const playerTitleId = useId();

const { timeline, error, preparing, isUnavailable, retry } = useMatchTimeline(
  () => props.match.matchId,
);

const defaultParticipant = () =>
  props.match.participants.find((participant) => participant.puuid === props.viewedPuuid)
    ?.participantId ??
  props.match.participants[0]?.participantId ??
  1;
const selected = ref(defaultParticipant());
watch(
  () => [props.match.matchId, props.viewedPuuid],
  () => (selected.value = defaultParticipant()),
);
const picked = computed({
  get: () => String(selected.value),
  // A single-select toggle group emits undefined when its active item is clicked again.
  set: (value: string | undefined) => {
    if (value) selected.value = Number(value);
  },
});
const showConsumables = ref(false);

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

function playerLabel(participant: MatchParticipant): string {
  const champion =
    lookup.value?.champion(participant.championId)?.name ??
    t('player.matches.unknownChampion', { id: participant.championId });
  const { gameName, tagLine } = participant;
  const name = gameName && tagLine ? formatRiotId({ gameName, tagLine }) : t('match.bot');
  return t('player.matches.participant', { name, champion });
}
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

      <section
        :aria-labelledby="playerTitleId"
        class="flex flex-col gap-5 rounded-xl bg-card p-4 text-card-foreground sm:p-5"
      >
        <h3 :id="playerTitleId" class="sr-only">{{ t('match.timeline.player') }}</h3>
        <ToggleGroup
          v-model="picked"
          type="single"
          :spacing="1"
          :aria-label="t('match.timeline.player')"
          class="flex flex-wrap justify-start gap-x-3 gap-y-2"
        >
          <div v-for="side in sides" :key="side.id" class="flex gap-1">
            <ToggleGroupItem
              v-for="participant in side.players"
              :key="participant.participantId"
              :value="String(participant.participantId)"
              :aria-label="playerLabel(participant)"
              :title="playerLabel(participant)"
              class="size-10 rounded-lg p-0.5 opacity-60 transition hover:opacity-100 data-[state=on]:bg-transparent data-[state=on]:opacity-100 data-[state=on]:ring-2 data-[state=on]:ring-primary"
            >
              <ChampionIcon :champion-id="participant.championId" class="size-full rounded-md" />
            </ToggleGroupItem>
          </div>
        </ToggleGroup>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-8">
          <BuildOrder
            v-model:show-consumables="showConsumables"
            :items="timeline.items"
            :participant-id="selected"
          />
          <SkillOrder :skills="timeline.skills" :participant-id="selected" />
        </div>
      </section>
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

    <div v-else class="flex flex-col gap-3" aria-hidden="true">
      <div v-if="!arena" class="rounded-xl bg-card p-4 sm:p-5">
        <Skeleton class="h-4 w-32 animate-shimmer skeleton-shimmer" />
        <Skeleton class="mt-4 h-44 w-full animate-shimmer rounded-lg skeleton-shimmer sm:h-56" />
      </div>
      <div class="flex flex-col gap-4 rounded-xl bg-card p-4 sm:p-5">
        <div class="flex flex-wrap gap-1">
          <Skeleton
            v-for="slot in 10"
            :key="slot"
            class="size-10 animate-shimmer rounded-lg skeleton-shimmer"
          />
        </div>
        <Skeleton class="h-16 w-full animate-shimmer rounded-lg skeleton-shimmer" />
      </div>
    </div>
  </section>
</template>
