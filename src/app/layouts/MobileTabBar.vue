<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { SECTIONS, useCurrentSection } from './sections';

const { t, locale } = useI18n();
const currentSection = useCurrentSection();
</script>

<template>
  <nav
    :aria-label="t('nav.label')"
    class="fixed inset-x-0 bottom-0 z-40 bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
  >
    <ul class="grid grid-cols-4">
      <li v-for="section in SECTIONS" :key="section.route">
        <RouterLink
          :to="{ name: section.route, params: { locale } }"
          :aria-current="currentSection === section.route ? 'page' : undefined"
          class="group flex h-14 flex-col items-center justify-center gap-1 text-xs text-muted-foreground aria-[current=page]:font-medium aria-[current=page]:text-foreground"
        >
          <span
            class="rounded-full px-4 py-0.5 group-aria-[current=page]:bg-brand-muted group-aria-[current=page]:text-brand-muted-foreground"
          >
            <component :is="section.icon" class="size-5" aria-hidden="true" />
          </span>
          {{ t(section.label) }}
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
