<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import AppHeader from './AppHeader.vue';
import MobileTabBar from './MobileTabBar.vue';

const { t } = useI18n();

// Switching the language or fixing a Riot ID's casing in the URL keeps the page mounted.
function pageKey(route: RouteLocationNormalizedLoaded): string {
  const { platform, riotId } = route.params;
  return [String(route.name), platform, typeof riotId === 'string' ? riotId.toLowerCase() : '']
    .filter(Boolean)
    .join(':');
}
</script>

<template>
  <div class="flex min-h-svh flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
    <AppHeader />

    <main class="mx-auto w-full max-w-page flex-1 px-4 py-8 sm:px-6">
      <RouterView v-slot="{ Component, route }">
        <Transition
          mode="out-in"
          enter-from-class="opacity-0 translate-y-1.5"
          enter-active-class="transition duration-300 ease-out"
          leave-to-class="opacity-0"
          leave-active-class="transition duration-150 ease-in"
        >
          <component :is="Component" :key="pageKey(route)" />
        </Transition>
      </RouterView>
    </main>

    <footer class="border-t">
      <p class="mx-auto max-w-page px-4 py-6 text-xs text-muted-foreground sm:px-6">
        {{ t('footer.legal') }}
      </p>
    </footer>

    <MobileTabBar />
  </div>
</template>
