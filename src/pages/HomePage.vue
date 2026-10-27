<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import DancingPoro from '@/components/DancingPoro.vue';
import { PlayerSearchForm, RecentPlayers } from '@/features/player-search';

const { t } = useI18n();
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

    <div class="hidden animate-rise justify-center self-start [animation-delay:200ms] lg:flex">
      <DancingPoro :label="t('home.petPoro')" />
    </div>
  </div>
</template>
