<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import TierCrest from '@/components/TierCrest.vue';
import { PlayerSearchForm, RecentPlayers } from '@/features/player-search';
import { TIERS } from '@/shared/riot';

const { t } = useI18n();

const ladder = [...TIERS].reverse();
const lastStep = ladder.length - 1;
</script>

<template>
  <div
    class="grid grid-cols-1 gap-14 pt-4 sm:pt-14 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16 lg:pt-20"
  >
    <div class="flex max-w-2xl flex-col gap-12">
      <section class="animate-rise">
        <h1 class="text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-6xl">
          {{ t('home.title') }}
        </h1>
        <p class="mt-3 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
          {{ t('home.subtitle') }}
        </p>
        <PlayerSearchForm class="mt-8 sm:mt-10" />
      </section>
      <RecentPlayers class="animate-rise [animation-delay:120ms]" />
    </div>

    <ol class="hidden flex-col gap-1.5 self-start lg:flex" aria-hidden="true">
      <li
        v-for="(tier, index) in ladder"
        :key="tier"
        class="ladder-step flex items-center gap-3"
        :style="{ '--step': lastStep - index, paddingLeft: `${(lastStep - index) * 0.9}rem` }"
      >
        <TierCrest :tier="tier" :reveal="false" class="size-7" />
        <span class="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          {{ t(`player.tiers.${tier}`) }}
        </span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.ladder-step {
  animation: rise 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both;
  animation-delay: calc(200ms + var(--step) * 45ms);
}
</style>
