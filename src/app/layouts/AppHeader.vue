<script setup lang="ts">
import { SearchIcon, XIcon } from '@lucide/vue';
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import AppLogo from '@/components/AppLogo.vue';
import { Button } from '@/components/ui/button';
import { LocaleSwitcher } from '@/features/locale-switcher';
import { PlayerSearchForm } from '@/features/player-search';
import { ThemeToggle } from '@/features/theme-toggle';
import { SECTIONS, useCurrentSection } from './sections';

const { t, locale } = useI18n();
const route = useRoute();
const currentSection = useCurrentSection();

// the home page is the search itself
const showSearch = computed(() => route.name !== 'home');
const searchOpen = ref(false);
watch(
  () => route.fullPath,
  () => (searchOpen.value = false),
);

const searchToggle = ref<InstanceType<typeof Button>>();
async function closeSearch(): Promise<void> {
  searchOpen.value = false;
  await nextTick();
  (searchToggle.value?.$el as HTMLElement | undefined)?.focus();
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b bg-background">
    <div class="mx-auto flex h-15 max-w-page items-center gap-3 px-4 sm:gap-6 sm:px-6">
      <RouterLink
        :to="{ name: 'home', params: { locale } }"
        class="flex items-center gap-2 text-lg font-semibold tracking-tight"
      >
        <AppLogo class="size-6" />
        {{ t('app.name') }}
      </RouterLink>

      <nav :aria-label="t('nav.label')" class="hidden items-center gap-1 md:flex">
        <RouterLink
          v-for="section in SECTIONS"
          :key="section.route"
          :to="{ name: section.route, params: { locale } }"
          :aria-current="currentSection === section.route ? 'page' : undefined"
          class="rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
        >
          {{ t(section.label) }}
        </RouterLink>
      </nav>

      <PlayerSearchForm v-if="showSearch" variant="compact" class="hidden flex-1 sm:block" />
      <div v-else class="hidden flex-1 sm:block" />

      <div class="ml-auto flex items-center gap-2 sm:ml-0 sm:gap-3">
        <Button
          v-if="showSearch"
          ref="searchToggle"
          variant="outline"
          size="icon"
          class="sm:hidden"
          :aria-label="t(searchOpen ? 'search.close' : 'search.open')"
          :aria-expanded="searchOpen"
          aria-controls="mobile-search"
          @click="searchOpen = !searchOpen"
        >
          <XIcon v-if="searchOpen" />
          <SearchIcon v-else />
        </Button>
        <LocaleSwitcher />
        <ThemeToggle />
      </div>
    </div>

    <div
      v-if="showSearch && searchOpen"
      id="mobile-search"
      class="border-t px-4 py-2 sm:hidden"
      @keydown.esc="closeSearch"
    >
      <PlayerSearchForm variant="compact" autofocus />
    </div>
  </header>
</template>
