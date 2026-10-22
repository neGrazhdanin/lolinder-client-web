<script setup lang="ts">
import { SearchIcon, XIcon } from '@lucide/vue';
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import AppLogo from '@/components/AppLogo.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LocaleSwitcher } from '@/features/locale-switcher';
import { ThemeToggle } from '@/features/theme-toggle';
import { SECTIONS } from './sections';

const { t, locale } = useI18n();
const route = useRoute();

const searchOpen = ref(false);
watch(
  () => route.fullPath,
  () => (searchOpen.value = false),
);
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
          class="rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground"
        >
          {{ t(section.label) }}
        </RouterLink>
      </nav>

      <Input
        type="search"
        disabled
        :placeholder="t('search.placeholder')"
        :aria-label="t('search.label')"
        class="hidden flex-1 sm:block"
      />

      <div class="ml-auto flex items-center gap-2 sm:ml-0 sm:gap-3">
        <Button
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

    <div v-if="searchOpen" id="mobile-search" class="border-t px-4 py-2 sm:hidden">
      <Input
        type="search"
        disabled
        :placeholder="t('search.placeholder')"
        :aria-label="t('search.label')"
      />
    </div>
  </header>
</template>
