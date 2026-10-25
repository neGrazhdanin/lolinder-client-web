<template>
  <span class="flex h-3 items-end gap-[2px]" aria-hidden="true">
    <span
      v-for="bar in 3"
      :key="bar"
      class="activity-bar h-full w-[3px] origin-bottom rounded-full bg-tier-mark"
      :style="{ animationDelay: `${(bar - 1) * 140}ms` }"
    />
  </span>
</template>

<style scoped>
.activity-bar {
  animation: sync-bar 0.9s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .activity-bar {
    animation: none;
    transform: scaleY(0.7);
  }
}
</style>
