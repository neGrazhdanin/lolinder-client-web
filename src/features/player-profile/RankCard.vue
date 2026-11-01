<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import RankEmblem from '@/components/RankEmblem.vue';
import { Skeleton } from '@/components/ui/skeleton';
import type { PlayerRank } from '@/shared/api';
import { useFormat } from '@/shared/i18n/format';
import { isApexTier, nextStep, type RankedQueue, winRate } from '@/shared/riot';
import { useRankName } from './useRankName';

const props = defineProps<{ queue: RankedQueue; rank?: PlayerRank; placeholder?: boolean }>();

const { t } = useI18n();
const format = useFormat();
const rankName = useRankName();

const apex = computed(() => (props.rank ? isApexTier(props.rank.tier) : false));
const rate = computed(() => (props.rank ? winRate(props.rank.wins, props.rank.losses) : null));
const next = computed(() => (props.rank ? nextStep(props.rank) : null));
const titleId = computed(() => `rank-${props.queue}`);
</script>

<template>
  <article
    :data-tier="rank?.tier ?? 'NONE'"
    :aria-labelledby="titleId"
    class="flex flex-col rounded-xl bg-card p-5 text-card-foreground"
  >
    <h2 :id="titleId" class="text-sm font-medium text-muted-foreground">
      {{ t(`player.queues.${queue}`) }}
    </h2>

    <template v-if="placeholder">
      <div class="mt-4 flex items-center gap-4">
        <span class="sr-only" role="status">{{ t('player.rank.loading') }}</span>
        <Skeleton class="size-12 animate-shimmer rounded-full skeleton-shimmer" />
        <div class="flex flex-1 flex-col gap-2">
          <Skeleton class="h-5 w-32 animate-shimmer skeleton-shimmer" />
          <Skeleton class="h-3.5 w-20 animate-shimmer skeleton-shimmer" />
        </div>
      </div>
    </template>

    <template v-else-if="rank">
      <div class="mt-4 flex items-center gap-4">
        <RankEmblem :tier="rank.tier" class="size-12" />
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <p class="truncate text-lg leading-tight font-semibold tracking-tight text-tier-ink">
            {{ rankName(rank.tier, rank.division) }}
          </p>
          <p v-if="next" class="text-xs text-muted-foreground">
            {{
              t('player.rank.nextStep', {
                lp: Math.max(0, 100 - rank.leaguePoints),
                rank: rankName(next.tier, next.division),
              })
            }}
          </p>
        </div>
        <p class="shrink-0 text-right">
          <span class="text-3xl font-semibold tracking-tight tabular-nums">{{
            format.integer(rank.leaguePoints)
          }}</span>
          <span class="ml-1 font-mono text-xs text-muted-foreground">{{
            t('player.rank.lp')
          }}</span>
        </p>
      </div>

      <div
        v-if="!apex"
        role="meter"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="rank.leaguePoints"
        :aria-label="t('player.rank.progress', { lp: rank.leaguePoints })"
        class="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          class="h-full rounded-full bg-tier-mark transition-[width] duration-700 ease-out"
          :style="{ width: `${Math.min(100, rank.leaguePoints)}%` }"
        />
      </div>

      <dl class="mt-5 grid grid-cols-3 gap-3 border-t pt-4">
        <div>
          <dt class="text-xs text-muted-foreground">{{ t('player.rank.wins') }}</dt>
          <dd class="mt-0.5 font-mono text-base font-medium">
            {{ format.integer(rank.wins) }}
          </dd>
        </div>
        <div>
          <dt class="text-xs text-muted-foreground">{{ t('player.rank.losses') }}</dt>
          <dd class="mt-0.5 font-mono text-base font-medium">
            {{ format.integer(rank.losses) }}
          </dd>
        </div>
        <div>
          <dt class="text-xs text-muted-foreground">{{ t('player.rank.winRate') }}</dt>
          <dd class="mt-0.5 font-mono text-base font-medium">
            {{ format.percent(rate ?? 0) }}
          </dd>
        </div>
      </dl>
      <div v-if="rate !== null" class="mt-3 flex h-1 gap-0.5" aria-hidden="true">
        <span class="rounded-l-full bg-win" :style="{ flexGrow: rank.wins }" />
        <span class="rounded-r-full bg-loss" :style="{ flexGrow: rank.losses }" />
      </div>
    </template>

    <div v-else class="mt-4 flex items-center gap-4">
      <RankEmblem class="size-12" />
      <div class="flex flex-col gap-0.5">
        <p class="text-lg leading-tight font-semibold tracking-tight">
          {{ t('player.rank.unranked') }}
        </p>
        <p class="text-xs text-muted-foreground">{{ t('player.rank.unrankedHint') }}</p>
      </div>
    </div>
  </article>
</template>
