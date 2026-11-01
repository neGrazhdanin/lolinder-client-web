<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Tier } from '@/shared/riot';

const props = withDefaults(defineProps<{ tier?: Tier | null; reveal?: boolean }>(), {
  tier: null,
  reveal: true,
});

const src = computed(() =>
  props.tier ? `${import.meta.env.BASE_URL}ranks/${props.tier.toLowerCase()}.webp` : undefined,
);

// Riot's art is lit for dark backgrounds, except the darkest tiers, which sink into dark surfaces.
const HALO: Partial<Record<Tier, number>> = { IRON: 0.12, BRONZE: 0.09, SILVER: 0.08 };
const halo = computed(() => (props.tier ? (HALO[props.tier] ?? 0.05) : 0));

const state = ref<'loading' | 'loaded' | 'failed'>('loading');
watch(src, () => (state.value = 'loading'));
</script>

<template>
  <span class="relative inline-grid shrink-0 place-items-center" aria-hidden="true">
    <span
      v-if="src && state === 'loaded'"
      class="emblem-halo absolute inset-0"
      :style="{ '--halo': halo }"
    />
    <img
      v-if="src && state !== 'failed'"
      :src="src"
      alt=""
      width="160"
      height="160"
      decoding="async"
      class="relative size-full object-contain"
      :class="state === 'loaded' ? (reveal ? 'emblem-reveal' : '') : 'opacity-0'"
      @load="state = 'loaded'"
      @error="state = 'failed'"
    />
    <span
      v-else
      class="grid aspect-square w-3/4 place-items-center rounded-full bg-muted"
      data-emblem="none"
    >
      <span class="h-0.5 w-1/3 rounded-full bg-muted-foreground" />
    </span>
  </span>
</template>

<style scoped>
.emblem-halo {
  display: none;
}

:global(.dark .emblem-halo) {
  display: block;
  background: radial-gradient(closest-side, oklch(1 0 0 / var(--halo)), transparent);
}

.emblem-reveal {
  animation: emblem-in 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
}
</style>
