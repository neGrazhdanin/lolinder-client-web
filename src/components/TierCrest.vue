<script setup lang="ts">
import { computed } from 'vue';
import { type Division, isApexTier, type Tier } from '@/shared/riot';

const props = withDefaults(
  defineProps<{ tier?: Tier | null; division?: Division | null; reveal?: boolean }>(),
  { tier: null, division: null, reveal: true },
);

const OUTER = '24,3 42.19,13.5 42.19,34.5 24,45 5.81,34.5 5.81,13.5';
const CORE = '24,10 36.12,17 36.12,31 24,38 11.88,31 11.88,17';
const GEM = '24,17 30.06,20.5 30.06,27.5 24,31 17.94,27.5 17.94,20.5';

const apex = computed(() => props.tier !== null && isApexTier(props.tier));
</script>

<template>
  <svg
    viewBox="0 0 48 48"
    :data-tier="tier ?? 'NONE'"
    :class="['shrink-0 overflow-visible', reveal && 'crest-reveal']"
    aria-hidden="true"
  >
    <polygon
      :points="OUTER"
      pathLength="1"
      class="crest-outline fill-none stroke-tier-mark"
      :class="tier ? 'stroke-2' : 'stroke-[1.5]'"
      stroke-linejoin="round"
    />
    <g class="crest-core">
      <polygon
        :points="CORE"
        :class="apex ? 'fill-tier-mark' : 'fill-tier-wash stroke-tier-line'"
        stroke-linejoin="round"
      />
      <polygon v-if="apex" :points="GEM" class="fill-tier-wash" stroke-linejoin="round" />
      <text
        v-else-if="tier && division"
        x="24"
        y="24.5"
        text-anchor="middle"
        dominant-baseline="central"
        class="fill-tier-strong font-mono text-[11px] font-semibold"
      >
        {{ division }}
      </text>
      <line
        v-else-if="!tier"
        x1="19"
        y1="24"
        x2="29"
        y2="24"
        class="stroke-muted-foreground"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </g>
  </svg>
</template>

<style scoped>
.crest-reveal .crest-outline {
  stroke-dasharray: 1;
  animation: line-draw 0.7s cubic-bezier(0.65, 0, 0.35, 1) both;
}

.crest-reveal .crest-core {
  transform-box: fill-box;
  transform-origin: center;
  animation: crest-core 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.2) 0.3s both;
}
</style>
