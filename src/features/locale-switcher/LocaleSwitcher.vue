<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { isLocale, rememberLocale, SUPPORTED_LOCALES } from '@/shared/i18n';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

const current = computed({
  get: () => locale.value,
  set: (next) => {
    // ToggleGroup emits undefined when the active item is clicked again
    if (!isLocale(next) || next === locale.value) return;
    rememberLocale(next);
    void router.push({
      name: route.name ?? 'home',
      params: { ...route.params, locale: next },
      query: route.query,
      hash: route.hash,
    });
  },
});
</script>

<template>
  <ToggleGroup
    v-model="current"
    type="single"
    size="sm"
    :spacing="0.5"
    :aria-label="t('locale.label')"
    class="rounded-lg bg-muted p-1"
  >
    <ToggleGroupItem
      v-for="code in SUPPORTED_LOCALES"
      :key="code"
      :value="code"
      :aria-label="t(`locale.${code}`)"
      class="h-9 rounded-sm px-3 text-xs text-muted-foreground data-[state=on]:bg-brand-muted data-[state=on]:font-semibold data-[state=on]:text-brand-muted-foreground data-[state=on]:ring-1 data-[state=on]:ring-primary data-[state=on]:ring-inset sm:h-7 sm:px-2.5"
    >
      {{ code.toUpperCase() }}
    </ToggleGroupItem>
  </ToggleGroup>
</template>
