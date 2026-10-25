<script setup lang="ts">
import { useIntervalFn, useNow } from '@vueuse/core';
import { SwordsIcon } from '@lucide/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ChampionIcon from '@/components/ChampionIcon.vue';
import StatePanel from '@/components/StatePanel.vue';
import { Skeleton } from '@/components/ui/skeleton';
import type { ChampionMastery } from '@/shared/api';
import { useFormat } from '@/shared/i18n/format';
import { useStaticData } from '@/shared/static-data';

const props = defineProps<{ masteries: ChampionMastery[]; placeholder?: boolean }>();

const { t } = useI18n();
const format = useFormat();
const now = useNow({ scheduler: (tick) => useIntervalFn(tick, 60_000) });
const { lookup } = useStaticData();

const top = computed(() => Math.max(1, ...props.masteries.map((mastery) => mastery.points)));
</script>

<template>
  <section aria-labelledby="mastery-title" class="rounded-xl border bg-card text-card-foreground">
    <header class="flex items-baseline justify-between gap-4 px-5 pt-5">
      <h2 id="mastery-title" class="text-base font-semibold tracking-tight">
        {{ t('player.mastery.title') }}
      </h2>
      <p class="text-xs text-muted-foreground">{{ t('player.mastery.subtitle') }}</p>
    </header>

    <ol
      v-if="placeholder"
      class="grid gap-x-8 px-5 pt-3 pb-4 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-5"
      aria-hidden="true"
    >
      <li v-for="row in 10" :key="row" class="flex items-center gap-3 py-2.5">
        <Skeleton class="size-10 animate-shimmer rounded-md skeleton-shimmer" />
        <div class="flex flex-1 flex-col gap-1.5">
          <Skeleton class="h-3.5 w-24 animate-shimmer skeleton-shimmer" />
          <Skeleton class="h-3 w-32 animate-shimmer skeleton-shimmer" />
        </div>
        <Skeleton class="h-3.5 w-12 animate-shimmer skeleton-shimmer" />
      </li>
    </ol>

    <ol
      v-else-if="masteries.length"
      class="grid gap-x-8 px-2 pt-2 pb-3 sm:grid-flow-col sm:grid-cols-2"
      :style="{ gridTemplateRows: `repeat(${Math.ceil(masteries.length / 2)}, auto)` }"
    >
      <li
        v-for="mastery in masteries"
        :key="mastery.championId"
        class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/60"
      >
        <span class="relative">
          <ChampionIcon :champion-id="mastery.championId" class="size-10" />
          <span
            class="absolute -right-1.5 -bottom-1.5 min-w-5 rounded-[5px] border bg-background px-1 text-center font-mono text-[10px] leading-4 font-medium"
            :title="t('player.mastery.level', { level: mastery.level })"
          >
            <span aria-hidden="true">{{ mastery.level }}</span>
            <span class="sr-only">{{ t('player.mastery.level', { level: mastery.level }) }}</span>
          </span>
        </span>
        <div class="min-w-0">
          <p class="truncate text-sm font-medium">
            {{
              lookup?.champion(mastery.championId)?.name ??
              t('player.mastery.unknownChampion', { id: mastery.championId })
            }}
          </p>
          <p class="truncate text-xs text-muted-foreground">
            {{
              t('player.mastery.lastPlayed', {
                time: format.relative(new Date(mastery.lastPlayedAt), now, 'short'),
              })
            }}
          </p>
        </div>
        <div class="flex min-w-16 flex-col items-end gap-1.5 sm:min-w-20">
          <p
            class="font-mono text-sm font-medium tabular-nums"
            :title="format.integer(mastery.points)"
          >
            {{ format.compact(mastery.points) }}
            <span class="sr-only">{{ t('player.mastery.points') }}</span>
          </p>
          <span class="h-1 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <span
              class="block h-full rounded-full bg-muted-foreground"
              :style="{ width: `${(mastery.points / top) * 100}%` }"
            />
          </span>
        </div>
      </li>
    </ol>

    <StatePanel
      v-else
      heading="h3"
      :title="t('player.mastery.empty')"
      :description="t('player.mastery.emptyHint')"
      class="px-5 pt-4 pb-6"
    >
      <template #icon><SwordsIcon /></template>
    </StatePanel>
  </section>
</template>
