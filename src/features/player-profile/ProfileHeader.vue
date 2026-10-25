<script setup lang="ts">
import { RefreshCwIcon } from '@lucide/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ActivityBars from '@/components/ActivityBars.vue';
import CountUp from '@/components/CountUp.vue';
import ProfileIcon from '@/components/ProfileIcon.vue';
import TierCrest from '@/components/TierCrest.vue';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Player, PlayerRank } from '@/shared/api';
import { useFormat } from '@/shared/i18n/format';
import { PLATFORM_CODES } from '@/shared/riot';
import SyncStatus from './SyncStatus.vue';
import { useRankName } from './useRankName';

const props = withDefaults(
  defineProps<{
    player: Pick<Player, 'gameName' | 'tagLine' | 'platform' | 'profileIconId'> &
      Partial<Pick<Player, 'summonerLevel' | 'sync'>>;
    rank?: PlayerRank | null;
    /** Ranks are not known yet: first sync, or the player is still being looked up. */
    rankPending?: boolean;
    /** Shown instead of the sync status while the player is being looked up. */
    lookingUp?: string;
    refreshing?: boolean;
    canRefresh?: boolean;
  }>(),
  { rank: null, rankPending: false, lookingUp: undefined, refreshing: false, canRefresh: true },
);
const emit = defineEmits<{ refresh: [] }>();

const { t } = useI18n();
const format = useFormat();
const rankName = useRankName();

const busy = computed(() => props.player.sync?.status === 'syncing' || props.refreshing);
</script>

<template>
  <!-- The page's one tinted surface: the plate takes the colour of the player's headline rank. -->
  <header
    :data-tier="rank?.tier ?? 'NONE'"
    class="relative isolate overflow-hidden rounded-2xl border border-tier-line bg-card"
  >
    <div
      class="absolute inset-0 -z-10 bg-[radial-gradient(110%_160%_at_100%_0%,var(--tier-wash)_0%,transparent_62%)]"
      aria-hidden="true"
    />

    <div class="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div class="flex min-w-0 items-center gap-4 sm:gap-5">
        <div class="relative shrink-0">
          <ProfileIcon
            :icon-id="player.profileIconId"
            alt=""
            class="size-16 rounded-2xl border border-tier-line sm:size-20"
          />
          <span
            v-if="player.summonerLevel != null"
            class="absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-md border bg-background px-1.5 py-px font-mono text-[11px] leading-4 font-medium"
          >
            <span aria-hidden="true">{{ player.summonerLevel }}</span>
            <span class="sr-only">{{ t('player.level', { level: player.summonerLevel }) }}</span>
          </span>
        </div>

        <div class="flex min-w-0 flex-col gap-2">
          <h1
            class="flex min-w-0 items-baseline gap-x-1.5 text-2xl font-semibold tracking-tight sm:text-4xl"
          >
            <span class="truncate">{{ player.gameName }}</span>
            <span class="shrink-0 font-normal tracking-normal text-muted-foreground">
              {{ `#${player.tagLine}` }}
            </span>
          </h1>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <span
              class="rounded-sm border bg-background/60 px-1.5 font-mono text-[11px] leading-5 font-medium tracking-wide text-foreground"
              :title="t(`platforms.${player.platform}`)"
            >
              <span aria-hidden="true">{{ PLATFORM_CODES[player.platform] }}</span>
              <span class="sr-only">{{ t(`platforms.${player.platform}`) }}</span>
            </span>
            <span v-if="lookingUp" class="inline-flex items-center gap-2" aria-hidden="true">
              <ActivityBars />
              {{ lookingUp }}
            </span>
            <template v-else-if="player.sync">
              <SyncStatus :sync="player.sync" />
              <Button
                v-if="canRefresh"
                variant="outline"
                size="sm"
                class="group/refresh h-8 gap-1.5 bg-background/60 px-2.5"
                :disabled="busy"
                @click="emit('refresh')"
              >
                <RefreshCwIcon
                  :class="[
                    'size-3.5 transition-transform duration-500',
                    busy ? 'animate-spin' : 'group-hover/refresh:rotate-90',
                  ]"
                  aria-hidden="true"
                />
                {{ t(busy ? 'player.refresh.busy' : 'player.refresh.label') }}
              </Button>
            </template>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-4 sm:flex-row-reverse sm:text-right">
        <TierCrest
          :tier="rankPending ? null : (rank?.tier ?? null)"
          :division="rank?.division ?? null"
          :reveal="!rankPending"
          :class="['size-16 sm:size-20', rankPending && 'opacity-60']"
        />
        <div v-if="rankPending" class="flex flex-col gap-2 sm:items-end">
          <Skeleton class="h-3.5 w-24 animate-shimmer skeleton-shimmer" />
          <Skeleton class="h-7 w-36 animate-shimmer skeleton-shimmer" />
        </div>
        <div v-else-if="rank" class="flex min-w-0 flex-col gap-0.5">
          <p class="text-xs font-medium text-muted-foreground">
            {{ t(`player.queues.${rank.queue}`) }}
          </p>
          <p class="text-lg leading-tight font-semibold tracking-tight text-tier-strong">
            {{ rankName(rank.tier, rank.division) }}
          </p>
          <p class="text-sm text-muted-foreground">
            <CountUp
              :value="rank.leaguePoints"
              :format="format.integer"
              class="text-2xl font-semibold tracking-tight text-foreground"
            />
            {{ t('player.rank.lp') }}
          </p>
        </div>
        <div v-else class="flex flex-col gap-0.5">
          <p class="text-lg leading-tight font-semibold tracking-tight">
            {{ t('player.rank.unranked') }}
          </p>
          <p class="text-sm text-muted-foreground">{{ t('player.rank.unrankedEverywhere') }}</p>
        </div>
      </div>
    </div>
  </header>
</template>
