<script setup lang="ts">
import { cn } from '@/shared/lib/utils';

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    tone?: 'neutral' | 'error';
    heading?: 'h1' | 'h2' | 'h3';
    class?: string;
  }>(),
  { description: undefined, tone: 'neutral', heading: 'h2', class: undefined },
);
</script>

<template>
  <section
    :class="cn('flex flex-col items-start gap-5 sm:flex-row sm:items-center', props.class)"
    :role="tone === 'error' ? 'alert' : undefined"
  >
    <span
      :class="[
        'grid size-14 shrink-0 place-items-center rounded-full [&_svg]:size-6',
        tone === 'error' ? 'bg-loss-muted text-loss' : 'bg-muted text-muted-foreground',
      ]"
      aria-hidden="true"
    >
      <slot name="icon" />
    </span>
    <div class="flex min-w-0 flex-col gap-1.5">
      <component
        :is="heading"
        :class="[
          'font-semibold tracking-tight text-balance',
          heading === 'h1' ? 'text-2xl sm:text-3xl' : 'text-base',
        ]"
      >
        {{ title }}
      </component>
      <p v-if="description" class="max-w-prose text-sm text-pretty text-muted-foreground">
        {{ description }}
      </p>
      <div v-if="$slots.default" class="mt-3 flex flex-wrap items-center gap-2">
        <slot />
      </div>
    </div>
  </section>
</template>
