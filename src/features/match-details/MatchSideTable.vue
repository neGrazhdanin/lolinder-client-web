<script setup lang="ts">
import { ChevronDownIcon } from '@lucide/vue';
import { computed, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import ChampionIcon from '@/components/ChampionIcon.vue';
import GameIcon from '@/components/GameIcon.vue';
import GameTooltip from '@/components/GameTooltip.vue';
import type { MatchParticipant } from '@/shared/api';
import { useFormat } from '@/shared/i18n/format';
import { cn } from '@/shared/lib/utils';
import { csPerMinute, formatRiotId, kdaRatio } from '@/shared/riot';
import { useStaticData } from '@/shared/static-data';
import { BLUE_SIDE, type MatchSide, playerLink } from './match-details';
import PlayerDetails from './PlayerDetails.vue';

const props = defineProps<{
  matchId: string;
  side: MatchSide;
  platform: string;
  durationSec: number;
  arena: boolean;
  damageScale: number | null;
  viewedPuuid?: string;
  /** Column names stay for screen readers only, when a table above already shows them. */
  quietHeader?: boolean;
}>();
const expanded = defineModel<number[]>('expanded', { required: true });

const { t, locale } = useI18n();
const format = useFormat();
const { lookup } = useStaticData();

const label = computed(() => {
  const { placement, result } = props.side;
  if (props.arena && placement !== null && result !== 'remake') {
    return t(`player.matches.placement.${format.ordinal(placement)}`, { place: placement });
  }
  return t(`player.matches.result.${result}`);
});
const sideName = computed(() =>
  props.arena ? null : t(props.side.teamId === BLUE_SIDE ? 'match.sides.blue' : 'match.sides.red'),
);

const detailsId = useId();

function toggle(participantId: number) {
  expanded.value = expanded.value.includes(participantId)
    ? expanded.value.filter((id) => id !== participantId)
    : [...expanded.value, participantId];
}

function onRowClick(event: MouseEvent, participantId: number) {
  if ((event.target as Element).closest('a, button, [data-game-tooltip]')) return;
  if (window.getSelection()?.toString()) return;
  toggle(participantId);
}

// Matches the CSS transition: the row itself has none, so Vue cannot detect when it ends.
const DETAILS_MS = 240;
const columns = computed(() => (props.arena ? 8 : 10));

const championName = (id: number) =>
  lookup.value?.champion(id)?.name ?? t('player.matches.unknownChampion', { id });

function rowOf(player: MatchParticipant) {
  const keystoneId = player.runes.perks[0];
  const treeId = player.runes.subStyle;
  const name =
    player.gameName && player.tagLine
      ? formatRiotId({ gameName: player.gameName, tagLine: player.tagLine })
      : t('match.bot');
  return {
    player,
    open: expanded.value.includes(player.participantId),
    detailsId: `${detailsId}-${player.participantId}`,
    toggleLabel: t('match.details.toggle', { name, champion: championName(player.championId) }),
    viewed: player.puuid === props.viewedPuuid,
    link: playerLink(locale.value, props.platform, player),
    champion: championName(player.championId),
    ratio: kdaRatio(player),
    perMinute: csPerMinute({ cs: player.cs, durationSec: props.durationSec }),
    damageShare:
      props.damageScale && props.damageScale > 0
        ? player.damageToChampions / props.damageScale
        : null,
    spells: player.summonerSpells.map((id) => ({ id, entry: lookup.value?.summonerSpell(id) })),
    keystone: keystoneId ? { id: keystoneId, entry: lookup.value?.rune(keystoneId) } : null,
    tree: treeId ? { id: treeId, entry: lookup.value?.runeTree(treeId) } : null,
    items: player.items.map((id, slot) => ({
      slot,
      id,
      entry: id ? lookup.value?.item(id) : undefined,
    })),
  };
}

const rows = computed(() => props.side.players.map(rowOf));

const ink = { win: 'text-win', loss: 'text-loss', remake: 'text-muted-foreground' };
const marker = { win: 'bg-win', loss: 'bg-loss', remake: 'bg-muted-foreground/40' };
</script>

<template>
  <section
    :data-result="side.result"
    class="@container overflow-hidden rounded-xl bg-card text-card-foreground"
  >
    <table role="table" :class="['side-table w-full text-sm', arena && 'arena']">
      <caption class="px-4 pt-3.5 pb-2 text-left @min-[62rem]:px-5">
        <span class="flex items-baseline gap-2.5">
          <span
            :class="[
              'inline-flex items-center gap-1.5 font-semibold tracking-tight',
              arena ? 'font-mono text-base' : 'text-sm',
              ink[side.result],
            ]"
          >
            <span :class="['h-3.5 w-[3px] rounded-full', marker[side.result]]" aria-hidden="true" />
            {{ label }}
          </span>
          <span v-if="sideName" class="text-xs text-muted-foreground">{{ sideName }}</span>
        </span>
      </caption>

      <thead role="rowgroup" :class="['head', quietHeader && 'quiet']">
        <tr role="row" class="text-[11px] font-medium text-muted-foreground">
          <th scope="col" role="columnheader" class="c-champ">
            <span class="sr-only">{{ t('match.columns.champion') }}</span>
          </th>
          <th scope="col" role="columnheader" class="c-loadout">
            <span class="sr-only">{{ t('match.columns.loadout') }}</span>
          </th>
          <th scope="col" role="columnheader" class="c-player">
            <span>{{ t('match.columns.player') }}</span>
          </th>
          <th scope="col" role="columnheader" class="c-kda">
            <span>{{ t('match.columns.kda') }}</span>
          </th>
          <th scope="col" role="columnheader" class="c-damage num">
            <span>{{ t('match.columns.damage') }}</span>
          </th>
          <th scope="col" role="columnheader" class="c-gold num">
            <span>{{ t('match.columns.gold') }}</span>
          </th>
          <template v-if="!arena">
            <th scope="col" role="columnheader" class="c-cs num">
              <span>{{ t('match.columns.cs') }}</span>
            </th>
            <th scope="col" role="columnheader" class="c-vision num">
              <span>{{ t('match.columns.vision') }}</span>
            </th>
          </template>
          <th scope="col" role="columnheader" class="c-items">
            <span>{{ t('match.columns.items') }}</span>
          </th>
          <th scope="col" role="columnheader" class="c-toggle">
            <span class="sr-only">{{ t('match.columns.details') }}</span>
          </th>
        </tr>
      </thead>

      <tbody role="rowgroup">
        <template v-for="row in rows" :key="row.player.puuid">
          <tr
            role="row"
            :data-viewed="row.viewed || undefined"
            :data-open="row.open || undefined"
            :class="['player-row cursor-pointer', row.viewed && 'bg-muted']"
            @click="onRowClick($event, row.player.participantId)"
          >
            <td role="cell" class="c-champ">
              <span v-if="row.viewed" :class="['viewed-mark', marker[side.result]]" />
              <span class="relative inline-block align-middle" :title="row.champion">
                <ChampionIcon :champion-id="row.player.championId" class="size-10 rounded-lg" />
                <span class="sr-only">{{ row.champion }}</span>
                <span
                  class="absolute -right-1.5 -bottom-1 min-w-5 rounded-[5px] border bg-background px-1 text-center font-mono text-[10px] leading-4 font-medium"
                >
                  <span aria-hidden="true">{{ row.player.champLevel }}</span>
                  <span class="sr-only">{{
                    t('player.level', { level: row.player.champLevel })
                  }}</span>
                </span>
              </span>
            </td>

            <td role="cell" class="c-loadout">
              <span class="loadout">
                <ul class="flex flex-col gap-0.5" :aria-label="t('player.matches.spells')">
                  <li v-for="(spell, index) in row.spells" :key="index">
                    <GameTooltip
                      :id="spell.id"
                      kind="summonerSpells"
                      :name="
                        spell.entry?.name ?? t('player.matches.unknownSpell', { id: spell.id })
                      "
                    >
                      <GameIcon
                        :native-title="false"
                        :src="spell.entry?.iconUrl"
                        :label="
                          spell.entry?.name ?? t('player.matches.unknownSpell', { id: spell.id })
                        "
                        :pending="!lookup"
                        class="size-4 rounded-[4px] @min-[62rem]:size-[18px]"
                      />
                    </GameTooltip>
                  </li>
                </ul>
                <ul
                  v-if="row.keystone || row.tree"
                  class="flex flex-col items-center gap-0.5"
                  :aria-label="t('player.matches.runes')"
                >
                  <li v-if="row.keystone">
                    <GameTooltip
                      :id="row.keystone.id"
                      kind="runes"
                      :name="
                        row.keystone.entry?.name ??
                        t('player.matches.unknownRune', { id: row.keystone.id })
                      "
                    >
                      <GameIcon
                        :native-title="false"
                        :src="row.keystone.entry?.iconUrl"
                        :label="
                          row.keystone.entry?.name ??
                          t('player.matches.unknownRune', { id: row.keystone.id })
                        "
                        :pending="!lookup"
                        class="size-4 rounded-full bg-foreground/85 @min-[62rem]:size-[18px] dark:bg-muted"
                      />
                    </GameTooltip>
                  </li>
                  <li
                    v-if="row.tree"
                    class="grid size-4 place-items-center rounded-full bg-foreground/85 @min-[62rem]:size-[18px] dark:bg-transparent"
                  >
                    <GameTooltip
                      :id="row.tree.id"
                      :name="
                        row.tree.entry?.name ?? t('player.matches.unknownRune', { id: row.tree.id })
                      "
                    >
                      <GameIcon
                        :native-title="false"
                        :src="row.tree.entry?.iconUrl"
                        :label="
                          row.tree.entry?.name ??
                          t('player.matches.unknownRune', { id: row.tree.id })
                        "
                        :pending="!lookup"
                        class="size-3 rounded-full bg-transparent @min-[62rem]:size-3.5"
                      />
                    </GameTooltip>
                  </li>
                </ul>
              </span>
            </td>

            <td role="cell" class="c-player">
              <RouterLink
                v-if="row.link"
                :to="row.link"
                class="block max-w-full truncate rounded-sm font-medium outline-none hover:underline hover:underline-offset-2 focus-visible:ring-3 focus-visible:ring-ring/50"
                :class="row.viewed && 'font-semibold'"
              >
                {{ row.player.gameName
                }}<span class="font-normal text-muted-foreground">{{
                  `#${row.player.tagLine}`
                }}</span>
              </RouterLink>
              <span v-else class="block truncate text-muted-foreground italic">
                {{ row.player.gameName ?? t('match.bot') }}
              </span>
              <span class="block truncate text-xs text-muted-foreground" aria-hidden="true">
                {{ row.champion }}
              </span>
            </td>

            <td role="cell" class="c-kda">
              <span class="sr-only">
                {{
                  t('player.matches.kdaLabel', {
                    kills: row.player.kills,
                    deaths: row.player.deaths,
                    assists: row.player.assists,
                  })
                }}
              </span>
              <span
                class="kda block font-mono text-[13px] leading-5 font-semibold whitespace-nowrap tabular-nums"
                aria-hidden="true"
              >
                <span>{{ format.integer(row.player.kills) }}</span>
                <span class="text-loss">{{ format.integer(row.player.deaths) }}</span>
                <span>{{ format.integer(row.player.assists) }}</span>
              </span>
              <span
                v-if="side.result !== 'remake'"
                class="block font-mono text-[11px] whitespace-nowrap text-muted-foreground tabular-nums"
              >
                <template v-if="row.ratio === null">{{ t('player.matches.perfectKda') }}</template>
                <template v-else>
                  {{ t('player.matches.kda', { ratio: format.decimal(row.ratio, 2) }) }}
                </template>
              </span>
            </td>

            <td role="cell" class="c-damage num">
              <span class="mini" aria-hidden="true">{{ t('match.columns.damage') }}</span>
              <span class="value">{{ format.integer(row.player.damageToChampions) }}</span>
              <span
                v-if="row.damageShare !== null"
                class="bar mt-1 block h-1 overflow-hidden rounded-full bg-foreground/10"
                aria-hidden="true"
              >
                <span
                  :class="[
                    'block h-full rounded-full',
                    row.viewed ? 'bg-primary' : 'bg-muted-foreground/70',
                  ]"
                  :style="{ width: `${Math.round(row.damageShare * 100)}%` }"
                />
              </span>
            </td>

            <td role="cell" class="c-gold num">
              <span class="mini" aria-hidden="true">{{ t('match.columns.gold') }}</span>
              <span class="value">{{ format.integer(row.player.goldEarned) }}</span>
            </td>

            <template v-if="!arena">
              <td role="cell" class="c-cs num">
                <span class="mini" aria-hidden="true">{{ t('match.columns.cs') }}</span>
                <span class="value">{{ format.integer(row.player.cs) }}</span>
                <span class="per-minute font-mono text-[11px] text-muted-foreground tabular-nums">
                  {{ t('player.matches.csPerMinute', { value: format.decimal(row.perMinute, 1) }) }}
                </span>
              </td>
              <td role="cell" class="c-vision num">
                <span class="mini" aria-hidden="true">{{ t('match.columns.vision') }}</span>
                <span class="value">{{ format.integer(row.player.visionScore) }}</span>
              </td>
            </template>

            <td role="cell" class="c-items">
              <ul class="flex items-center gap-0.5" :aria-label="t('player.matches.items')">
                <li
                  v-for="item in row.items"
                  :key="item.slot"
                  :class="item.slot === 6 && 'ml-1'"
                  :aria-hidden="item.id === 0 || undefined"
                >
                  <GameTooltip
                    v-if="item.id !== 0"
                    :id="item.id"
                    kind="items"
                    :name="item.entry?.name ?? t('player.matches.unknownItem', { id: item.id })"
                  >
                    <GameIcon
                      :native-title="false"
                      :src="item.entry?.iconUrl"
                      :label="item.entry?.name ?? t('player.matches.unknownItem', { id: item.id })"
                      :pending="!lookup"
                      :class="
                        cn(
                          'size-[22px] rounded-[4px] @min-[62rem]:size-6',
                          item.slot === 6 && 'rounded-full',
                        )
                      "
                    />
                  </GameTooltip>
                  <span
                    v-else
                    :class="[
                      'block size-[22px] rounded-[4px] bg-foreground/[0.07] @min-[62rem]:size-6',
                      item.slot === 6 && 'rounded-full',
                    ]"
                  />
                </li>
              </ul>
            </td>

            <td role="cell" class="c-toggle">
              <button
                type="button"
                :aria-expanded="row.open"
                :aria-controls="row.detailsId"
                :aria-label="row.toggleLabel"
                class="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-foreground/[0.06] hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                @click="toggle(row.player.participantId)"
              >
                <ChevronDownIcon
                  :class="['size-4 transition-transform', row.open && 'rotate-180']"
                  aria-hidden="true"
                />
              </button>
            </td>
          </tr>
          <Transition name="details" :duration="DETAILS_MS">
            <tr v-if="row.open" :id="row.detailsId" role="row" class="details-row">
              <td role="cell" :colspan="columns">
                <div class="details-clip">
                  <div class="details-body">
                    <PlayerDetails :match-id="matchId" :participant="row.player" />
                  </div>
                </div>
              </td>
            </tr>
          </Transition>
        </template>
      </tbody>

      <tfoot v-if="!arena" role="rowgroup">
        <tr role="row" class="totals-row text-muted-foreground">
          <td role="cell" class="c-champ" />
          <td role="cell" class="c-loadout" />
          <th scope="row" role="rowheader" class="c-player text-xs font-medium">
            {{ t('match.total') }}
          </th>
          <td role="cell" class="c-kda">
            <span class="sr-only">
              {{
                t('player.matches.kdaLabel', {
                  kills: side.totals.kills,
                  deaths: side.totals.deaths,
                  assists: side.totals.assists,
                })
              }}
            </span>
            <span
              class="kda block font-mono text-[13px] font-semibold whitespace-nowrap text-foreground tabular-nums"
              aria-hidden="true"
            >
              <span>{{ format.integer(side.totals.kills) }}</span>
              <span>{{ format.integer(side.totals.deaths) }}</span>
              <span>{{ format.integer(side.totals.assists) }}</span>
            </span>
          </td>
          <td role="cell" class="c-damage num">
            <span class="mini" aria-hidden="true">{{ t('match.columns.damage') }}</span>
            <span class="value text-foreground">
              {{ format.integer(side.totals.damageToChampions) }}
            </span>
          </td>
          <td role="cell" class="c-gold num">
            <span class="mini" aria-hidden="true">{{ t('match.columns.gold') }}</span>
            <span class="value text-foreground">{{ format.integer(side.totals.goldEarned) }}</span>
          </td>
          <td role="cell" class="c-cs" />
          <td role="cell" class="c-vision" />
          <td role="cell" class="c-items" />
          <td role="cell" class="c-toggle" />
        </tr>
      </tfoot>
    </table>
  </section>
</template>

<style scoped>
.side-table {
  border-collapse: collapse;
}

.value {
  display: block;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.25rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.per-minute {
  display: block;
  white-space: nowrap;
}

.loadout {
  display: flex;
  gap: 2px;
}

.c-champ {
  position: relative;
}

.viewed-mark {
  position: absolute;
  inset-block: 0.5rem;
  left: 0;
  width: 3px;
  border-radius: 0 9999px 9999px 0;
}

.kda > span + span::before {
  content: '/';
  margin-inline: 0.25em;
  font-weight: 400;
  color: var(--muted-foreground);
}

.player-row:not(:first-child),
.details-row {
  border-top: 1px solid color-mix(in oklab, var(--border), transparent 40%);
}

.details-row > td {
  padding: 0;
  background: color-mix(in oklab, var(--foreground), transparent 97%);
}

.details-clip {
  display: grid;
  grid-template-rows: 1fr;
  transition:
    grid-template-rows 240ms cubic-bezier(0.2, 0, 0, 1),
    opacity 240ms ease;
}

.details-body {
  min-height: 0;
  overflow: hidden;
}

.details-body > * {
  padding: 1rem 1.25rem 1.25rem;
}

.details-enter-from .details-clip,
.details-leave-to .details-clip {
  grid-template-rows: 0fr;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .details-clip {
    transition: none;
  }
}

.totals-row {
  border-top: 1px solid var(--border);
}

/* Wide: a real table with a header row. */
@container (width >= 62rem) {
  .side-table {
    table-layout: fixed;
  }

  th,
  td {
    padding: 0.5rem;
    vertical-align: middle;
    text-align: left;
  }

  th:first-child,
  td:first-child {
    padding-left: 1.25rem;
  }

  th:last-child,
  td:last-child {
    padding-right: 1.25rem;
  }

  thead th {
    padding-block: 0 0.375rem;
    white-space: nowrap;
  }

  .num {
    text-align: right;
  }

  .mini {
    display: none;
  }

  .c-champ {
    width: 4.25rem;
  }
  .c-loadout {
    width: 3.25rem;
  }
  .c-kda {
    width: 6.75rem;
  }
  .c-damage {
    width: 9rem;
  }
  .c-gold {
    width: 5rem;
  }
  .c-cs {
    width: 5.5rem;
  }
  .c-vision {
    width: 4.25rem;
  }
  .c-items {
    width: 13rem;
  }
  .c-toggle {
    width: 3rem;
  }

  th.c-toggle,
  td.c-toggle {
    padding-left: 0;
  }

  .arena .c-damage {
    width: 6rem;
  }

  /* The row stays in the layout: a fixed table takes its column widths from the first row. */
  .head.quiet th {
    padding-block: 0;
  }

  .head.quiet th > span {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  .totals-row td,
  .totals-row th {
    padding-block: 0.625rem;
  }
}

/* Cells keep their DOM order so screen readers still pair them with the column headers. */
@container (width < 62rem) {
  .side-table,
  .side-table caption,
  .side-table tbody,
  .side-table tfoot,
  .details-row,
  .details-row > td {
    display: block;
  }

  .details-body > * {
    padding: 0.875rem 1rem 1rem;
  }

  .head,
  .totals-row td:empty {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .player-row,
  .totals-row {
    --indent: 3.125rem;
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    column-gap: 0.625rem;
    padding: 0.625rem 1rem;
  }

  .player-row::before,
  .player-row::after,
  .totals-row::before,
  .totals-row::after {
    content: '';
    flex-basis: 100%;
  }

  .player-row::before,
  .totals-row::before {
    order: 3;
  }

  .player-row::after,
  .totals-row::after {
    order: 6;
  }

  td,
  th {
    display: block;
    text-align: left;
  }

  .c-champ {
    position: static;
    order: 0;
    width: 2.5rem;
  }

  .c-player {
    order: 1;
    flex: 1 1 0;
    min-width: 0;
  }

  .c-kda {
    order: 2;
    text-align: right;
  }

  .c-toggle {
    order: 2;
    margin-right: -0.5rem;
  }

  .totals-row .c-toggle {
    display: none;
  }

  .c-loadout {
    order: 4;
    margin: 0.5rem 0 0 var(--indent);
  }

  .loadout ul {
    flex-direction: row;
  }

  .c-items {
    order: 5;
    margin-top: 0.5rem;
  }

  .c-damage,
  .c-gold,
  .c-cs,
  .c-vision {
    align-self: flex-start;
    margin-top: 0.5rem;
  }

  .c-damage {
    order: 7;
    min-width: 3.5rem;
    margin-left: var(--indent);
  }

  .c-gold {
    order: 8;
  }

  .c-cs {
    order: 9;
  }

  .c-vision {
    order: 10;
  }

  .mini {
    display: block;
    font-size: 11px;
    line-height: 1rem;
    color: var(--muted-foreground);
    white-space: nowrap;
  }

  .c-cs .value,
  .c-cs .per-minute {
    display: inline;
  }

  .c-cs .per-minute {
    margin-left: 0.375rem;
  }

  .viewed-mark {
    inset-block: 0.625rem;
  }

  .totals-row .c-player {
    margin-left: var(--indent);
  }
}
</style>
