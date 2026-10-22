<script setup lang="ts">
import { LanguagesIcon } from '@lucide/vue';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { isLocale, rememberLocale, SUPPORTED_LOCALES } from '@/shared/i18n';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

const current = computed({
  get: () => locale.value,
  set: (next) => {
    if (!isLocale(next)) return;
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
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" :aria-label="t('locale.label')">
        <LanguagesIcon />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuRadioGroup v-model="current">
        <DropdownMenuRadioItem v-for="code in SUPPORTED_LOCALES" :key="code" :value="code">
          {{ t(`locale.${code}`) }}
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
