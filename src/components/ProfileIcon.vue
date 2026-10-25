<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AppLogo from '@/components/AppLogo.vue';
import { cn } from '@/shared/lib/utils';
import { ddragonUrl, useStaticData } from '@/shared/static-data';

const props = defineProps<{ iconId: number | null; alt: string; class?: string }>();

const { version, isError } = useStaticData();
const src = computed(() =>
  version.value && props.iconId !== null
    ? ddragonUrl.profileIcon(version.value, props.iconId)
    : undefined,
);

const state = ref<'loading' | 'loaded' | 'failed'>('loading');
watch(src, () => (state.value = 'loading'));

const fallback = computed(() => props.iconId === null || isError.value || state.value === 'failed');
</script>

<template>
  <span
    :class="
      cn('relative inline-grid shrink-0 place-items-center overflow-hidden bg-muted', props.class)
    "
  >
    <img
      v-if="src && !fallback"
      :src="src"
      :alt="alt"
      decoding="async"
      width="128"
      height="128"
      class="size-full object-cover transition-opacity duration-300"
      :class="state === 'loaded' ? 'opacity-100' : 'opacity-0'"
      @load="state = 'loaded'"
      @error="state = 'failed'"
    />
    <AppLogo v-if="fallback" class="size-1/2 text-muted-foreground" />
    <span
      v-else-if="state === 'loading'"
      class="absolute inset-0 animate-shimmer skeleton-shimmer"
      aria-hidden="true"
    />
  </span>
</template>
