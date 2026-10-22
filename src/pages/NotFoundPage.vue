<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Button } from '@/components/ui/button';

const { t, locale } = useI18n();
</script>

<template>
  <section class="flex flex-col items-center gap-4 py-16 text-center">
    <h1 class="text-2xl font-semibold">{{ t('notFound.title') }}</h1>
    <Button as-child variant="outline">
      <RouterLink :to="{ name: 'home', params: { locale } }">{{ t('notFound.back') }}</RouterLink>
    </Button>
  </section>
</template>
