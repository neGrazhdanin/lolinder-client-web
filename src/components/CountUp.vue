<script setup lang="ts">
import { TransitionPresets, usePreferredReducedMotion, useTransition } from '@vueuse/core';
import { computed, onMounted, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{ value: number; format?: (value: number) => string; duration?: number }>(),
  { format: (value: number) => String(Math.round(value)), duration: 900 },
);

const motion = usePreferredReducedMotion();
const reduced = computed(() => motion.value === 'reduce');

const target = ref(reduced.value ? props.value : 0);
onMounted(() => (target.value = props.value));
watch(
  () => props.value,
  (value) => (target.value = value),
);

const shown = useTransition(target, {
  duration: props.duration,
  easing: TransitionPresets.easeOutCubic,
  disabled: reduced,
});
</script>

<template>
  <span>
    <span class="tabular-nums" aria-hidden="true">{{ format(shown) }}</span>
    <span class="sr-only">{{ format(value) }}</span>
  </span>
</template>
