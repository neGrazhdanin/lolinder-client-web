<script setup lang="ts">
import { useId } from 'vue';

withDefaults(defineProps<{ mono?: boolean }>(), { mono: false });

const cutout = useId();
</script>

<template>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <template v-if="mono">
      <mask :id="cutout" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="#fff" />
        <rect x="5.4" y="4.6" width="3.3" height="14.6" rx="1.65" fill="#000" />
        <circle cx="15.3" cy="14.5" r="3.55" fill="none" stroke="#000" stroke-width="3.3" />
      </mask>
      <rect width="24" height="24" rx="6.5" fill="currentColor" :mask="`url(#${cutout})`" />
    </template>
    <template v-else>
      <rect width="24" height="24" rx="6.5" fill="var(--primary)" />
      <rect x="5.4" y="4.6" width="3.3" height="14.6" rx="1.65" fill="var(--primary-foreground)" />
      <circle
        cx="15.3"
        cy="14.5"
        r="3.55"
        fill="none"
        stroke="var(--primary-foreground)"
        stroke-width="3.3"
      />
    </template>
  </svg>
</template>
