<script setup lang="ts">
import { HourglassIcon } from '@lucide/vue';
import { TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import GameMarkup from '@/components/GameMarkup.vue';
import { Skeleton } from '@/components/ui/skeleton';
import { useFormat } from '@/shared/i18n/format';
import {
  type DescribedKind,
  markupText,
  useStaticData,
  useStaticDescriptions,
} from '@/shared/static-data';

const props = withDefaults(
  defineProps<{
    /** Without a kind the tooltip shows the name only. */
    kind?: DescribedKind;
    id: number;
    name: string;
    /** Hover-only when the icon sits in an aria-hidden group. */
    focusable?: boolean;
  }>(),
  { kind: undefined, focusable: true },
);

const { t } = useI18n();
const format = useFormat();
const { lookup } = useStaticData();
const { descriptions, isPending, request } = useStaticDescriptions();

const open = ref(false);
watch(open, (value) => value && props.kind && request());

const description = computed(() =>
  props.kind ? descriptions.value?.get(props.kind, props.id) : undefined,
);
const item = computed(() => (props.kind === 'items' ? lookup.value?.item(props.id) : undefined));
const cost = computed(() => (item.value && item.value.gold > 0 ? item.value.gold : null));
const cooldown = computed(() =>
  cost.value === null && description.value?.cooldownSec
    ? t('tooltip.cooldown', { seconds: format.integer(description.value.cooldownSec) })
    : null,
);
const nodes = computed(() => {
  const parsed = description.value?.nodes;
  if (parsed?.length) return parsed;
  return item.value?.plaintext ? [{ type: 'text' as const, text: item.value.plaintext }] : [];
});

// Reka copies the content into its role="tooltip" node once, before descriptions arrive.
const ariaLabel = computed(() =>
  [
    props.name,
    cost.value !== null && `${t('tooltip.cost')} ${format.integer(cost.value)}`,
    cooldown.value,
    nodes.value.map(markupText).join(''),
  ]
    .filter(Boolean)
    .join('. '),
);

// Touch has no hover, so a tap toggles the tooltip; a tap outside closes it.
let touched = false;
function onPointerDown(event: PointerEvent) {
  touched = event.pointerType === 'touch';
}
function onClick() {
  if (touched) open.value = !open.value;
}
</script>

<template>
  <TooltipRoot v-model:open="open" disable-closing-trigger>
    <TooltipTrigger
      as-child
      class="rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring"
      :tabindex="focusable ? 0 : -1"
      data-game-tooltip
      @pointerdown="onPointerDown"
      @click="onClick"
    >
      <slot />
    </TooltipTrigger>
    <TooltipPortal>
      <TooltipContent
        side="top"
        :side-offset="6"
        :collision-padding="8"
        :aria-label="ariaLabel"
        data-slot="game-tooltip"
        class="z-50 flex w-max max-w-72 flex-col gap-1.5 rounded-lg border bg-popover px-3 py-2.5 text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=instant-open]:animate-in data-[state=instant-open]:fade-in-0"
      >
        <p class="flex items-baseline justify-between gap-4">
          <span class="text-sm font-semibold">{{ name }}</span>
          <span
            v-if="cost !== null"
            class="inline-flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground tabular-nums"
          >
            <span class="coin" aria-hidden="true" />
            <span class="sr-only">{{ t('tooltip.cost') }}</span>
            {{ format.integer(cost) }}
          </span>
          <span
            v-else-if="cooldown"
            class="inline-flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground tabular-nums"
          >
            <HourglassIcon class="size-3.5 self-center" aria-hidden="true" />
            {{ cooldown }}
          </span>
        </p>
        <template v-if="kind">
          <GameMarkup v-if="nodes.length" :nodes="nodes" />
          <div v-else-if="isPending" class="flex flex-col gap-1.5 py-0.5" aria-hidden="true">
            <Skeleton class="h-3 w-56 animate-shimmer skeleton-shimmer" />
            <Skeleton class="h-3 w-40 animate-shimmer skeleton-shimmer" />
          </div>
        </template>
      </TooltipContent>
    </TooltipPortal>
  </TooltipRoot>
</template>

<style scoped>
.coin {
  width: 0.6875rem;
  height: 0.6875rem;
  align-self: center;
  border-radius: 9999px;
  background: oklch(0.8 0.14 85);
  box-shadow: inset 0 0 0 1.5px oklch(0.62 0.13 70);
}
</style>
