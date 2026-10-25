<script setup lang="ts">
import { CircleHelpIcon } from '@lucide/vue';
import { computed, ref, watch } from 'vue';
import { useStaticData } from '@/shared/static-data';
import { cn } from '@/shared/lib/utils';

const props = defineProps<{ championId: number; class?: string }>();

const { lookup, isError } = useStaticData();
const champion = computed(() => lookup.value?.champion(props.championId));

const state = ref<'loading' | 'loaded' | 'failed'>('loading');
watch(
  () => champion.value?.iconUrl,
  () => (state.value = 'loading'),
);

const shimmering = computed(
  () => !isError.value && (!lookup.value || (champion.value && state.value === 'loading')),
);
</script>

<template>
  <span
    :class="cn('relative inline-block shrink-0 overflow-hidden rounded-md bg-muted', props.class)"
  >
    <img
      v-if="champion && state !== 'failed'"
      :src="champion.iconUrl"
      alt=""
      loading="lazy"
      decoding="async"
      width="120"
      height="120"
      class="size-full scale-110 object-cover transition-opacity duration-300"
      :class="state === 'loaded' ? 'opacity-100' : 'opacity-0'"
      @load="state = 'loaded'"
      @error="state = 'failed'"
    />
    <CircleHelpIcon
      v-if="lookup && !champion"
      class="absolute inset-0 m-auto size-1/2 text-muted-foreground"
      aria-hidden="true"
    />
    <span
      v-if="shimmering"
      class="absolute inset-0 animate-shimmer skeleton-shimmer"
      aria-hidden="true"
    />
  </span>
</template>
