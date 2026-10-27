<script setup lang="ts">
import { useIntervalFn, useNow } from '@vueuse/core';
import { computed, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import ChampionIcon from '@/components/ChampionIcon.vue';
import GameIcon from '@/components/GameIcon.vue';
import type { MatchHistoryItem, MatchHistoryParticipant } from '@/shared/api';
import { useFormat } from '@/shared/i18n/format';
import { cn } from '@/shared/lib/utils';
import { formatRiotId, queueName } from '@/shared/riot';
import { useStaticData } from '@/shared/static-data';
import { csPerMinute, kdaRatio, matchResult, teamsOf } from './match-history';

const props = defineProps<{ match: MatchHistoryItem; puuid: string }>();

const { t } = useI18n();
const format = useFormat();
const now = useNow({ scheduler: (tick) => useIntervalFn(tick, 60_000) });
const { lookup } = useStaticData();
const resultId = useId();
const championId = useId();

const result = computed(() => matchResult(props.match));
const ratio = computed(() => kdaRatio(props.match));
const resultLabel = computed(() => {
  const { placement } = props.match;
  if (placement === null || result.value === 'remake') {
    return t(`player.matches.result.${result.value}`);
  }
  return t(`player.matches.placement.${format.ordinal(placement)}`, { place: placement });
});
const startedAt = computed(() => new Date(props.match.startedAt));
const teams = computed(() => teamsOf(props.match.participants));
// Arena's eight duos do not fit name columns; they stay icons with names in titles.
const duos = computed(() => teams.value.length > 2);

const queueLabel = computed(() => t(`player.matches.queues.${queueName(props.match.queueId)}`));
const queueLabelCompact = computed(() => {
  const name = queueName(props.match.queueId);
  return name === 'solo' || name === 'flex' ? t(`player.queuesShort.${name}`) : queueLabel.value;
});

const championName = (id: number) =>
  lookup.value?.champion(id)?.name ?? t('player.matches.unknownChampion', { id });

const items = computed(() =>
  props.match.items.map((id, slot) => ({
    slot,
    id,
    entry: id ? lookup.value?.item(id) : undefined,
  })),
);
const spells = computed(() =>
  props.match.summonerSpells.map((id) => ({ id, entry: lookup.value?.summonerSpell(id) })),
);
const keystone = computed(() => {
  const id = props.match.runes.perks[0];
  return id === undefined ? null : { id, entry: lookup.value?.rune(id) };
});
const secondaryTree = computed(() => {
  const id = props.match.runes.subStyle;
  return id === null ? null : { id, entry: lookup.value?.runeTree(id) };
});

function playerName(participant: MatchHistoryParticipant): string {
  return participant.gameName ?? championName(participant.championId);
}

function playerTitle(participant: MatchHistoryParticipant): string {
  const champion = championName(participant.championId);
  const { gameName, tagLine } = participant;
  if (!gameName) return champion;
  const name = tagLine ? formatRiotId({ gameName, tagLine }) : gameName;
  return t('player.matches.participant', { name, champion });
}

const durationIso = computed(() => {
  const seconds = Math.max(0, Math.round(props.match.durationSec));
  return `PT${Math.floor(seconds / 60)}M${seconds % 60}S`;
});

const rail = { win: 'before:bg-win', loss: 'before:bg-loss', remake: 'before:bg-border' };
const wash = {
  win: 'from-win-muted',
  loss: 'from-loss-muted',
  remake: 'from-transparent',
};
const ink = { win: 'text-win', loss: 'text-loss', remake: 'text-muted-foreground' };
</script>

<template>
  <article
    :aria-labelledby="`${resultId} ${championId}`"
    :data-result="result"
    :class="[
      'relative isolate grid overflow-hidden rounded-xl border bg-card py-3 pr-3 pl-4 text-card-foreground @xl:py-3.5 @xl:pr-4 @xl:pl-5',
      'before:absolute before:inset-y-0 before:left-0 before:w-1',
      rail[result],
      'match-grid gap-x-4 gap-y-3 @xl:gap-x-5 @4xl:items-center',
    ]"
  >
    <div
      :class="[
        'absolute inset-y-0 left-0 -z-10 w-2/3 bg-linear-to-r to-transparent @xl:w-1/2',
        wash[result],
      ]"
      aria-hidden="true"
    />

    <div
      class="flex min-w-0 items-baseline gap-x-2 gap-y-0.5 [grid-area:meta] @xl:flex-col @xl:items-start @xl:justify-center"
    >
      <h3 :id="resultId" :class="['shrink-0 text-sm font-semibold tracking-tight', ink[result]]">
        {{ resultLabel }}
      </h3>
      <p
        class="min-w-0 truncate text-xs font-medium text-foreground @xl:text-[13px]"
        :title="queueLabel"
      >
        <span class="@xl:hidden" aria-hidden="true">{{ queueLabelCompact }}</span>
        <span class="sr-only @xl:not-sr-only">{{ queueLabel }}</span>
      </p>
      <p
        class="ml-auto flex shrink-0 items-baseline gap-1.5 text-xs text-muted-foreground @xl:mt-1 @xl:ml-0"
      >
        <time
          :datetime="match.startedAt"
          :title="format.date(startedAt, { dateStyle: 'medium', timeStyle: 'short' })"
        >
          {{ format.relative(startedAt, now, 'short') }}
        </time>
        <span class="size-0.5 self-center rounded-full bg-muted-foreground" aria-hidden="true" />
        <time :datetime="durationIso" class="font-mono tabular-nums">
          {{ format.clock(match.durationSec) }}
        </time>
      </p>
    </div>

    <div class="flex items-center gap-1.5 [grid-area:champ]">
      <span class="relative mr-1" :title="championName(match.championId)">
        <ChampionIcon :champion-id="match.championId" class="size-11 rounded-lg @xl:size-12" />
        <span :id="championId" class="sr-only">{{ championName(match.championId) }}</span>
        <span
          class="absolute -right-1.5 -bottom-1.5 min-w-5 rounded-[5px] border bg-background px-1 text-center font-mono text-[10px] leading-4 font-medium"
        >
          <span aria-hidden="true">{{ match.champLevel }}</span>
          <span class="sr-only">{{ t('player.level', { level: match.champLevel }) }}</span>
        </span>
      </span>
      <ul class="flex flex-col gap-0.5" :aria-label="t('player.matches.spells')">
        <li v-for="(spell, index) in spells" :key="index">
          <GameIcon
            :src="spell.entry?.iconUrl"
            :label="spell.entry?.name ?? t('player.matches.unknownSpell', { id: spell.id })"
            :pending="!lookup"
            class="size-5 rounded-[4px]"
          />
        </li>
      </ul>
      <ul class="flex flex-col items-center gap-0.5" :aria-label="t('player.matches.runes')">
        <li v-if="keystone">
          <GameIcon
            :src="keystone.entry?.iconUrl"
            :label="keystone.entry?.name ?? t('player.matches.unknownRune', { id: keystone.id })"
            :pending="!lookup"
            class="size-5 rounded-full bg-foreground/85 dark:bg-muted"
          />
        </li>
        <li
          v-if="secondaryTree"
          class="grid size-5 place-items-center rounded-full bg-foreground/85 dark:bg-transparent"
        >
          <GameIcon
            :src="secondaryTree.entry?.iconUrl"
            :label="
              secondaryTree.entry?.name ?? t('player.matches.unknownRune', { id: secondaryTree.id })
            "
            :pending="!lookup"
            class="size-3.5 rounded-full bg-transparent"
          />
        </li>
      </ul>
    </div>

    <div class="flex flex-col justify-center gap-0.5 [grid-area:stats]">
      <p class="font-mono text-[15px] leading-5 font-semibold tracking-tight tabular-nums">
        <span class="sr-only">
          {{
            t('player.matches.kdaLabel', {
              kills: match.kills,
              deaths: match.deaths,
              assists: match.assists,
            })
          }}
        </span>
        <span class="kda" aria-hidden="true">
          <span>{{ format.integer(match.kills) }}</span>
          <span class="text-loss">{{ format.integer(match.deaths) }}</span>
          <span>{{ format.integer(match.assists) }}</span>
        </span>
      </p>
      <p v-if="result !== 'remake'" class="font-mono text-xs text-muted-foreground tabular-nums">
        <template v-if="ratio === null">
          <span class="font-medium text-foreground">{{ t('player.matches.perfectKda') }}</span>
        </template>
        <template v-else>
          {{ t('player.matches.kda', { ratio: format.decimal(ratio, 2) }) }}
        </template>
      </p>
    </div>

    <div class="flex flex-col items-end justify-center gap-0.5 [grid-area:cs] @xl:items-start">
      <p class="font-mono text-sm leading-5 font-medium tabular-nums">
        {{ t('player.matches.cs', { cs: format.integer(match.cs) }) }}
      </p>
      <p class="font-mono text-xs text-muted-foreground tabular-nums">
        {{ t('player.matches.csPerMinute', { value: format.decimal(csPerMinute(match), 1) }) }}
      </p>
    </div>

    <div
      class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 [grid-area:bottom] @xl:contents"
    >
      <ul
        class="flex items-center gap-0.5 @xl:[grid-area:build]"
        :aria-label="t('player.matches.items')"
      >
        <li
          v-for="item in items"
          :key="item.slot"
          :class="item.slot === 6 && 'ml-1.5'"
          :aria-hidden="item.id === 0 || undefined"
        >
          <GameIcon
            v-if="item.id !== 0"
            :src="item.entry?.iconUrl"
            :label="item.entry?.name ?? t('player.matches.unknownItem', { id: item.id })"
            :pending="!lookup"
            :class="cn('size-6 rounded-[5px] @xl:size-7', item.slot === 6 && 'rounded-full')"
          />
          <span
            v-else
            :class="[
              'block size-6 rounded-[5px] bg-muted/70 ring-1 ring-border ring-inset @xl:size-7',
              item.slot === 6 && 'rounded-full',
            ]"
          />
        </li>
      </ul>

      <div
        :class="[
          'grid gap-y-1 @xl:self-center @xl:justify-self-end @xl:[grid-area:teams] @4xl:justify-self-stretch',
          duos
            ? 'w-fit grid-cols-4 gap-x-2.5 @xl:grid-cols-2 @4xl:grid-cols-4 @4xl:justify-self-start'
            : 'grid-cols-1 gap-x-3 @4xl:grid-cols-2',
        ]"
      >
        <ul
          v-for="(team, index) in teams"
          :key="index"
          :aria-label="t('player.matches.team', { number: index + 1 })"
          :class="[
            'flex min-w-0 gap-0.5',
            duos ? 'flex-row' : 'flex-row @4xl:flex-col @4xl:gap-px',
          ]"
        >
          <li
            v-for="participant in team"
            :key="participant.puuid"
            :title="playerTitle(participant)"
            :data-viewed="participant.puuid === puuid || undefined"
            :class="[
              'flex min-w-0 items-center gap-1.5 rounded-[5px]',
              !duos && '@4xl:px-1 @4xl:py-px',
              participant.puuid === puuid && !duos && '@4xl:bg-muted',
            ]"
          >
            <ChampionIcon
              :champion-id="participant.championId"
              :class="
                cn(
                  'size-4.5 rounded-[4px] @4xl:size-4',
                  participant.puuid === puuid &&
                    'ring-2 ring-foreground/80 ring-offset-1 ring-offset-card',
                  participant.puuid === puuid && !duos && '@4xl:ring-0 @4xl:ring-offset-0',
                )
              "
            />
            <span
              v-if="!duos"
              aria-hidden="true"
              :class="[
                'hidden truncate text-xs @4xl:block',
                participant.puuid === puuid
                  ? 'font-medium text-foreground'
                  : 'text-muted-foreground',
                !participant.gameName && 'italic',
              ]"
            >
              {{ playerName(participant) }}
            </span>
            <span class="sr-only">{{ playerTitle(participant) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </article>
</template>

<style scoped>
/* Laid out by the list's width, not the viewport's: the card may move into a narrower column. */
.match-grid {
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas:
    'meta meta meta'
    'champ stats cs'
    'bottom bottom bottom';
}

@container (width >= 36rem) {
  .match-grid {
    grid-template-columns: 7.5rem auto 6.5rem auto minmax(0, 1fr);
    grid-template-areas:
      'meta champ stats cs teams'
      'meta build build build teams';
  }
}

@container (width >= 56rem) {
  .match-grid {
    grid-template-columns: 7.5rem auto 6.5rem 5rem auto minmax(0, 1fr);
    grid-template-areas: 'meta champ stats cs build teams';
  }
}

.kda > span + span::before {
  content: '/';
  margin-inline: 0.3em;
  font-weight: 400;
  color: var(--muted-foreground);
}
</style>
