<script setup lang="ts">
import { CircleHelpIcon } from '@lucide/vue';
import { computed, ref, watch } from 'vue';
import { cn } from '@/shared/lib/utils';

const props = defineProps<{
  src: string | undefined;
  label: string;
  pending?: boolean;
  class?: string;
}>();

const state = ref<'loading' | 'loaded' | 'failed'>('loading');
watch(
  () => props.src,
  () => (state.value = 'loading'),
);
const showImage = computed(() => !!props.src && state.value !== 'failed');
</script>

<template>
  <span
    :class="cn('relative inline-block shrink-0 overflow-hidden bg-muted', props.class)"
    :title="label"
  >
    <img
      v-if="showImage"
      :src="src"
      :alt="label"
      loading="lazy"
      decoding="async"
      width="64"
      height="64"
      class="size-full object-cover transition-opacity duration-300"
      :class="state === 'loaded' ? 'opacity-100' : 'opacity-0'"
      @load="state = 'loaded'"
      @error="state = 'failed'"
    />
    <template v-else>
      <CircleHelpIcon
        v-if="!pending"
        class="absolute inset-0 m-auto size-3/5 text-muted-foreground"
        aria-hidden="true"
      />
      <span class="sr-only">{{ label }}</span>
    </template>
    <span
      v-if="pending || (showImage && state === 'loading')"
      class="absolute inset-0 animate-shimmer skeleton-shimmer"
      aria-hidden="true"
    />
  </span>
</template>
