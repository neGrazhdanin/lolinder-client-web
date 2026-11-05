<script setup lang="ts">
import { type FunctionalComponent, h, type VNode } from 'vue';
import type { MarkupNode } from '@/shared/static-data';

defineProps<{ nodes: MarkupNode[] }>();

function render(nodes: MarkupNode[]): (VNode | string)[] {
  return nodes.map((node) => {
    switch (node.type) {
      case 'text':
        return node.text;
      case 'break':
        return h('br');
      case 'rule':
        return h('hr', { class: 'my-2 border-border' });
      case 'stats':
        return h('span', { class: 'stats' }, render(node.children));
      case 'bullet':
        return h('span', { class: 'bullet' }, render(node.children));
      case 'span':
        return h('span', { class: `tone-${node.tone}` }, render(node.children));
    }
  });
}

const Nodes: FunctionalComponent<{ nodes: MarkupNode[] }> = (props) => render(props.nodes);
</script>

<template>
  <span class="game-markup"><Nodes :nodes="nodes" /></span>
</template>

<style scoped>
.game-markup {
  --ap: oklch(0.55 0.17 265);
  --ad: oklch(0.58 0.15 50);
  --heal: oklch(0.55 0.14 150);
  --mana: oklch(0.56 0.12 235);
  --defense: oklch(0.6 0.11 85);
  --gold: oklch(0.62 0.13 85);
  display: block;
  font-size: 0.75rem;
  line-height: 1.125rem;
  color: var(--muted-foreground);
}

.game-markup:where(.dark *) {
  --ap: oklch(0.75 0.13 270);
  --ad: oklch(0.78 0.12 55);
  --heal: oklch(0.78 0.13 150);
  --mana: oklch(0.76 0.1 235);
  --defense: oklch(0.82 0.1 90);
  --gold: oklch(0.84 0.13 90);
}

.game-markup :deep(.stats) {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--foreground);
}

.game-markup :deep(.bullet) {
  display: block;
  position: relative;
  margin-top: 0.25rem;
  padding-left: 0.75rem;
}

.game-markup :deep(.bullet)::before {
  content: '';
  position: absolute;
  left: 0.125rem;
  top: 0.5rem;
  width: 0.25rem;
  height: 0.25rem;
  border-radius: 9999px;
  background: currentColor;
  opacity: 0.6;
}

.game-markup :deep(.tone-name) {
  font-weight: 600;
  color: var(--foreground);
}

.game-markup :deep(.tone-value) {
  font-weight: 600;
  color: var(--foreground);
}

.game-markup :deep(.tone-ap) {
  color: var(--ap);
}

.game-markup :deep(.tone-ad) {
  color: var(--ad);
}

.game-markup :deep(.tone-true) {
  font-weight: 600;
  color: var(--foreground);
}

.game-markup :deep(.tone-heal) {
  color: var(--heal);
}

.game-markup :deep(.tone-mana) {
  color: var(--mana);
}

.game-markup :deep(.tone-defense) {
  color: var(--defense);
}

.game-markup :deep(.tone-speed),
.game-markup :deep(.tone-keyword) {
  color: var(--foreground);
  font-style: italic;
}

.game-markup :deep(.tone-gold) {
  color: var(--gold);
}

.game-markup :deep(.tone-muted) {
  font-style: italic;
  opacity: 0.8;
}

.game-markup :deep(.tone-danger) {
  color: var(--loss);
}
</style>
