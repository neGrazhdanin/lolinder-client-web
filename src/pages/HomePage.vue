<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Badge } from '@/components/ui/badge';
import { healthControllerCheckOptions } from '@/shared/api';

const { t } = useI18n();
const health = useQuery({ ...healthControllerCheckOptions(), retry: false });

const apiStatus = computed(() => {
  if (health.isPending.value) return 'checking';
  return health.isSuccess.value ? 'online' : 'offline';
});
</script>

<template>
  <section class="flex flex-col items-center gap-3 py-16 text-center">
    <h1 class="text-4xl font-semibold tracking-tight">{{ t('home.title') }}</h1>
    <p class="text-muted-foreground">{{ t('home.subtitle') }}</p>
    <Badge variant="outline">
      {{ t('home.apiStatus.text', { status: t(`home.apiStatus.${apiStatus}`) }) }}
    </Badge>
  </section>
</template>
