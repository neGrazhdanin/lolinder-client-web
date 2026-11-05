<script setup lang="ts">
import { computed, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import GameIcon from '@/components/GameIcon.vue';
import GameTooltip from '@/components/GameTooltip.vue';
import type { MatchRunes } from '@/shared/api';
import { cn } from '@/shared/lib/utils';
import { useStaticData } from '@/shared/static-data';
import { type RuneTreeView, runePage, shardIconUrl } from './runes';

const props = defineProps<{ runes: MatchRunes }>();

const { t, te } = useI18n();
const { lookup } = useStaticData();
const titleId = useId();

const page = computed(() => runePage(props.runes, lookup.value));

const treeName = (tree: RuneTreeView) =>
  tree.entry?.name ?? t('player.matches.unknownRune', { id: tree.id });
const shardName = (id: number) =>
  te(`match.details.shards.${id}`)
    ? t(`match.details.shards.${id}`)
    : t('match.details.unknownShard', { id });
</script>

<template>
  <section v-if="page" :aria-labelledby="titleId" class="flex flex-col gap-3">
    <header class="flex h-8 items-center">
      <h3 :id="titleId" class="text-sm font-semibold tracking-tight">
        {{ t('player.matches.runes') }}
      </h3>
    </header>

    <div class="flex gap-6">
      <div class="tree">
        <p class="tree-name">
          <GameIcon
            :src="page.primary.entry?.iconUrl"
            :label="treeName(page.primary)"
            :pending="!lookup"
            class="size-5 bg-transparent"
          />
          <span aria-hidden="true">{{ treeName(page.primary) }}</span>
        </p>
        <ul class="rows" :aria-label="treeName(page.primary)">
          <li
            v-for="(row, slot) in page.primary.rows"
            :key="slot"
            :class="cn('row', slot === 0 && 'keystones')"
          >
            <span
              v-for="option in row"
              :key="option.id"
              :data-picked="option.picked || undefined"
              :aria-hidden="!option.picked || undefined"
              class="rune"
            >
              <GameTooltip
                :id="option.id"
                kind="runes"
                :name="option.entry.name"
                :focusable="option.picked"
              >
                <GameIcon
                  :native-title="false"
                  :src="option.entry.iconUrl"
                  :label="option.entry.name"
                  class="size-full bg-transparent"
                />
              </GameTooltip>
            </span>
          </li>
        </ul>
      </div>

      <div class="tree">
        <template v-if="page.secondary">
          <p class="tree-name">
            <GameIcon
              :src="page.secondary.entry?.iconUrl"
              :label="treeName(page.secondary)"
              :pending="!lookup"
              class="size-5 bg-transparent"
            />
            <span aria-hidden="true">{{ treeName(page.secondary) }}</span>
          </p>
          <ul class="rows" :aria-label="treeName(page.secondary)">
            <li v-for="(row, slot) in page.secondary.rows" :key="slot" class="row">
              <span
                v-for="option in row"
                :key="option.id"
                :data-picked="option.picked || undefined"
                :aria-hidden="!option.picked || undefined"
                class="rune"
              >
                <GameTooltip
                  :id="option.id"
                  kind="runes"
                  :name="option.entry.name"
                  :focusable="option.picked"
                >
                  <GameIcon
                    :native-title="false"
                    :src="option.entry.iconUrl"
                    :label="option.entry.name"
                    class="size-full bg-transparent"
                  />
                </GameTooltip>
              </span>
            </li>
          </ul>
        </template>

        <ul
          v-if="page.shards.length"
          class="row mt-auto border-t pt-3"
          :aria-label="t('match.details.shardsTitle')"
        >
          <li v-for="(shard, slot) in page.shards" :key="slot" class="shard">
            <GameTooltip :id="shard" :name="shardName(shard)">
              <GameIcon
                :native-title="false"
                :src="shardIconUrl(shard)"
                :label="shardName(shard)"
                class="size-full bg-transparent"
              />
            </GameTooltip>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tree {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tree-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 1.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--muted-foreground);
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 2rem;
}

.row.keystones {
  height: 2.5rem;
}

.rune {
  display: block;
  width: 2rem;
  height: 2rem;
  padding: 3px;
  border-radius: 9999px;
  opacity: 0.45;
  filter: grayscale(1) brightness(0.45);
}

.keystones .rune {
  width: 2.5rem;
  height: 2.5rem;
  padding: 2px;
}

/* Riot draws rune and shard icons for a dark backdrop, so the light theme gives them one. */
.rune[data-picked],
.shard {
  opacity: 1;
  filter: none;
  background: color-mix(in oklab, var(--foreground), transparent 12%);
}

.shard {
  width: 1.5rem;
  height: 1.5rem;
  padding: 3px;
  border-radius: 9999px;
}

.rune:where(.dark *) {
  opacity: 0.3;
  filter: grayscale(1);
}

.rune[data-picked]:where(.dark *) {
  opacity: 1;
  filter: none;
  background: var(--brand-muted);
}

.shard:where(.dark *) {
  background: color-mix(in oklab, var(--foreground), transparent 88%);
}
</style>
