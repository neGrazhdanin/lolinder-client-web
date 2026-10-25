<script setup lang="ts">
import { UserRoundSearchIcon } from '@lucide/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import StatePanel from '@/components/StatePanel.vue';
import { Platform } from '@/shared/api';
import { formatRiotId, PLATFORM_CODES, type RiotId, riotIdToSlug } from '@/shared/riot';
import PlayerSearchForm from './PlayerSearchForm.vue';

const props = defineProps<{ platform: Platform; riotId: RiotId | null }>();

const { t, locale } = useI18n();

const POPULAR: Platform[] = [Platform.EUW1, Platform.EUN1, Platform.NA1, Platform.KR, Platform.RU];
const otherRegions = computed(() => POPULAR.filter((platform) => platform !== props.platform));
</script>

<template>
  <div class="flex max-w-2xl flex-col gap-10 py-6 sm:py-12">
    <StatePanel
      heading="h1"
      :title="
        riotId
          ? t('player.notFound.title', {
              riotId: formatRiotId(riotId),
              region: PLATFORM_CODES[platform],
            })
          : t('player.notFound.invalidTitle')
      "
      :description="t('player.notFound.description')"
    >
      <template #icon><UserRoundSearchIcon /></template>
    </StatePanel>

    <nav
      v-if="riotId"
      :aria-label="t('player.notFound.otherRegions')"
      class="flex flex-wrap items-center gap-2"
    >
      <span class="mr-1 text-sm text-muted-foreground">{{
        t('player.notFound.otherRegions')
      }}</span>
      <RouterLink
        v-for="region in otherRegions"
        :key="region"
        :to="{ name: 'player', params: { locale, platform: region, riotId: riotIdToSlug(riotId) } }"
        class="rounded-md border px-3 py-2.5 font-mono text-xs font-medium transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none sm:px-2.5 sm:py-1"
      >
        {{ PLATFORM_CODES[region] }}
      </RouterLink>
    </nav>

    <PlayerSearchForm
      :key="`${platform}:${riotId ? formatRiotId(riotId) : ''}`"
      :initial-riot-id="riotId ? formatRiotId(riotId) : ''"
      :initial-platform="platform"
    />
  </div>
</template>
