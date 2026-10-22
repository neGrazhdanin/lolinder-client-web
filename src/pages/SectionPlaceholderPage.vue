<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <section class="flex flex-col items-center gap-2 py-16 text-center">
    <h1 class="text-2xl font-semibold">{{ t('placeholder.title') }}</h1>
    <p class="text-muted-foreground">{{ t('placeholder.subtitle') }}</p>
  </section>
</template>
