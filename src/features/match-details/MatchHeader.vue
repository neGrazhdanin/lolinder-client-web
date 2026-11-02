<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ChampionIcon from '@/components/ChampionIcon.vue';
import { Badge } from '@/components/ui/badge';
import type { Match, MatchParticipant } from '@/shared/api';
import { isoDuration, useFormat } from '@/shared/i18n/format';
import { isPlatform, matchResult, PLATFORM_CODES, queueName } from '@/shared/riot';
import { useStaticData } from '@/shared/static-data';
import { BLUE_SIDE, type MatchSide } from './match-details';

const props = defineProps<{
  match: Match;
  sides: MatchSide[];
  arena: boolean;
  viewed?: MatchParticipant;
}>();

const { t } = useI18n();
const format = useFormat();
const { lookup } = useStaticData();

const queue = computed(() => t(`player.matches.queues.${queueName(props.match.queueId)}`));
const startedAt = computed(() => new Date(props.match.startedAt));
const platformCode = computed(() =>
  isPlatform(props.match.platform) ? PLATFORM_CODES[props.match.platform] : null,
);

const viewedResult = computed(() =>
  props.viewed ? matchResult({ win: props.viewed.win, remake: props.match.remake }) : null,
);
const viewedLabel = computed(() => {
  const placement = props.viewed?.placement ?? null;
  if (!viewedResult.value) return null;
  if (placement === null || viewedResult.value === 'remake') {
    return t(`player.matches.result.${viewedResult.value}`);
  }
  return t(`player.matches.placement.${format.ordinal(placement)}`, { place: placement });
});
const viewedChampion = computed(() =>
  props.viewed
    ? (lookup.value?.champion(props.viewed.championId)?.name ??
      t('player.matches.unknownChampion', { id: props.viewed.championId }))
    : '',
);

const score = computed(() => {
  if (props.arena) return null;
  const blue = props.sides.find((side) => side.teamId === BLUE_SIDE);
  const red = props.sides.find((side) => side.teamId !== BLUE_SIDE);
  return blue && red ? { blue, red } : null;
});

const ink = { win: 'text-win', loss: 'text-loss', remake: 'text-muted-foreground' };
</script>

<template>
  <header
    class="flex flex-col gap-6 rounded-2xl bg-card p-5 text-card-foreground sm:p-6 md:flex-row md:items-center md:justify-between"
  >
    <div class="flex min-w-0 items-center gap-4">
      <span v-if="viewed" class="shrink-0" :title="viewedChampion">
        <ChampionIcon :champion-id="viewed.championId" class="size-14 rounded-xl sm:size-16" />
      </span>
      <div class="flex min-w-0 flex-col gap-2">
        <h1 class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 tracking-tight">
          <span
            v-if="viewedResult && viewedLabel"
            :class="['text-3xl font-semibold sm:text-4xl', ink[viewedResult]]"
          >
            {{ viewedLabel }}
          </span>
          <span v-if="viewed" class="sr-only">{{ viewedChampion }}</span>
          <span
            :class="
              viewed
                ? 'text-lg font-medium text-muted-foreground sm:text-xl'
                : 'text-2xl font-semibold sm:text-3xl'
            "
          >
            {{ queue }}
          </span>
        </h1>
        <p
          class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground [&>.dot]:size-0.5 [&>.dot]:rounded-full [&>.dot]:bg-muted-foreground"
        >
          <time :datetime="match.startedAt" class="w-full sm:w-auto">
            {{ format.date(startedAt, { dateStyle: 'medium', timeStyle: 'short' }) }}
          </time>
          <span class="dot max-sm:hidden" aria-hidden="true" />
          <span>
            <span class="sr-only">{{ t('match.duration') }}</span>
            <time :datetime="isoDuration(match.durationSec)" class="font-mono tabular-nums">
              {{ format.clock(match.durationSec) }}
            </time>
          </span>
          <span class="dot" aria-hidden="true" />
          <span>{{ t('match.patch', { patch: match.patch }) }}</span>
          <template v-if="platformCode">
            <span class="dot" aria-hidden="true" />
            <span class="font-mono text-xs" :title="t(`platforms.${match.platform}`)">
              <span aria-hidden="true">{{ platformCode }}</span>
              <span class="sr-only">{{ t(`platforms.${match.platform}`) }}</span>
            </span>
          </template>
          <Badge v-if="match.remake && !viewed" variant="secondary" class="ml-1">
            {{ t('player.matches.result.remake') }}
          </Badge>
        </p>
      </div>
    </div>

    <div v-if="score" class="flex items-center gap-4 self-stretch sm:gap-5 md:self-auto">
      <p class="sr-only">
        {{ t('match.score', { blue: score.blue.totals.kills, red: score.red.totals.kills }) }}
      </p>
      <div
        class="flex flex-1 flex-col items-start gap-0.5 md:flex-none md:items-end"
        aria-hidden="true"
      >
        <span class="text-xs whitespace-nowrap text-muted-foreground">
          <span class="sm:hidden">{{ t('match.sidesShort.blue') }}</span>
          <span class="max-sm:hidden">{{ t('match.sides.blue') }}</span>
        </span>
        <span :class="['text-sm font-semibold', ink[score.blue.result]]">
          {{ t(`player.matches.result.${score.blue.result}`) }}
        </span>
      </div>
      <p
        class="flex items-baseline gap-3 font-mono text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl"
        aria-hidden="true"
      >
        <span>{{ format.integer(score.blue.totals.kills) }}</span>
        <span class="h-[3px] w-3 self-center rounded-full bg-muted-foreground/60 sm:w-4" />
        <span>{{ format.integer(score.red.totals.kills) }}</span>
      </p>
      <div
        class="flex flex-1 flex-col items-end gap-0.5 md:flex-none md:items-start"
        aria-hidden="true"
      >
        <span class="text-xs whitespace-nowrap text-muted-foreground">
          <span class="sm:hidden">{{ t('match.sidesShort.red') }}</span>
          <span class="max-sm:hidden">{{ t('match.sides.red') }}</span>
        </span>
        <span :class="['text-sm font-semibold', ink[score.red.result]]">
          {{ t(`player.matches.result.${score.red.result}`) }}
        </span>
      </div>
    </div>
  </header>
</template>
