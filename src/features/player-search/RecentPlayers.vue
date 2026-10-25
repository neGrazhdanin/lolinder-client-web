<script setup lang="ts">
import { XIcon } from '@lucide/vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import ProfileIcon from '@/components/ProfileIcon.vue';
import { formatRiotId, PLATFORM_CODES, riotIdToSlug } from '@/shared/riot';
import { usePlayerSearchStore } from './store';

const { t, locale } = useI18n();
const store = usePlayerSearchStore();
const { recent } = storeToRefs(store);
</script>

<template>
  <section v-if="recent.length" aria-labelledby="recent-players-title">
    <h2
      id="recent-players-title"
      class="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase"
    >
      {{ t('search.recent.title') }}
    </h2>
    <ul class="grid gap-x-6 sm:grid-cols-2">
      <li
        v-for="player in recent"
        :key="player.puuid"
        class="group/recent relative flex items-center gap-3 border-b py-2.5"
      >
        <ProfileIcon
          :icon-id="player.profileIconId"
          alt=""
          class="size-9 rounded-md transition-transform group-hover/recent:scale-105"
        />
        <RouterLink
          :to="{
            name: 'player',
            params: { locale, platform: player.platform, riotId: riotIdToSlug(player) },
          }"
          class="min-w-0 flex-1 truncate rounded-sm font-medium outline-none after:absolute after:inset-0 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {{ player.gameName }}
          <span class="font-normal text-muted-foreground">{{ `#${player.tagLine}` }}</span>
        </RouterLink>
        <span class="font-mono text-xs text-muted-foreground">
          {{ PLATFORM_CODES[player.platform] }}
        </span>
        <button
          type="button"
          class="relative z-10 -mr-1.5 grid size-10 place-items-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 sm:size-8"
          :aria-label="t('search.recent.remove', { riotId: formatRiotId(player) })"
          @click="store.forget(player.puuid)"
        >
          <XIcon class="size-4" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </section>
</template>
