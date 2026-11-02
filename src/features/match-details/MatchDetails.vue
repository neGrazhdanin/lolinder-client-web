<script setup lang="ts">
import { ArrowLeftIcon, MessageSquareIcon } from '@lucide/vue';
import { computed, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import StatePanel from '@/components/StatePanel.vue';
import type { Match } from '@/shared/api';
import { formatRiotId } from '@/shared/riot';
import MatchHeader from './MatchHeader.vue';
import MatchSideTable from './MatchSideTable.vue';
import MatchTimeline from './MatchTimeline.vue';
import { isArena, matchSides, maxDamage, playerLink, viewedParticipant } from './match-details';

const props = defineProps<{ match: Match; viewedPuuid?: string }>();

const { t, locale } = useI18n();
const teamsId = useId();

const arena = computed(() => isArena(props.match));
const sides = computed(() => matchSides(props.match));
const viewed = computed(() => viewedParticipant(props.match, props.viewedPuuid));
// Arena duos fight different opponents each round, so bars across all sixteen compare little.
const damageScale = computed(() => (arena.value ? null : maxDamage(props.match)));

const back = computed(() => {
  const player = viewed.value;
  const link = player ? playerLink(locale.value, props.match.platform, player) : null;
  return link && player?.gameName && player.tagLine
    ? { link, riotId: formatRiotId({ gameName: player.gameName, tagLine: player.tagLine }) }
    : null;
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-3">
      <RouterLink
        v-if="back"
        :to="back.link"
        :aria-label="t('match.backToProfile', { riotId: back.riotId })"
        class="inline-flex w-fit items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ArrowLeftIcon class="size-4" aria-hidden="true" />
        {{ back.riotId }}
      </RouterLink>
      <MatchHeader :match="match" :sides="sides" :arena="arena" :viewed="viewed" />
    </div>

    <section :aria-labelledby="teamsId" class="flex flex-col gap-3">
      <h2 :id="teamsId" class="sr-only">{{ t('match.scoreboard') }}</h2>
      <MatchSideTable
        v-for="(side, index) in sides"
        :key="side.id"
        :side="side"
        :platform="match.platform"
        :duration-sec="match.durationSec"
        :arena="arena"
        :damage-scale="damageScale"
        :viewed-puuid="viewed?.puuid"
        :quiet-header="arena && index > 0"
      />
    </section>

    <MatchTimeline :match="match" :sides="sides" :arena="arena" :viewed-puuid="viewed?.puuid" />

    <StatePanel
      :title="t('match.comments.title')"
      :description="t('match.comments.soon')"
      class="rounded-xl border border-dashed p-5"
    >
      <template #icon><MessageSquareIcon /></template>
    </StatePanel>
  </div>
</template>
