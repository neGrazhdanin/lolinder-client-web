import type { MatchRunes } from '@/shared/api';
import { ddragonUrl, type StaticEntry, type StaticLookup } from '@/shared/static-data';

export interface RuneOption {
  id: number;
  entry: StaticEntry;
  picked: boolean;
}

export interface RuneTreeView {
  id: number;
  entry: StaticEntry | undefined;
  rows: RuneOption[][];
}

export interface RunePage {
  primary: RuneTreeView;
  secondary: RuneTreeView | null;
  shards: number[];
}

function treeView(
  lookup: StaticLookup | undefined,
  treeId: number,
  picked: ReadonlySet<number>,
  skipKeystones: boolean,
): RuneTreeView {
  const tree = lookup?.runeTree(treeId);
  const slots = (tree?.slots ?? []).slice(skipKeystones ? 1 : 0);
  return {
    id: treeId,
    entry: tree,
    rows: slots.map((slot) =>
      slot.map((entry) => ({ id: entry.id, entry, picked: picked.has(entry.id) })),
    ),
  };
}

export function runePage(runes: MatchRunes, lookup: StaticLookup | undefined): RunePage | null {
  if (runes.primaryStyle === null) return null;
  const picked = new Set(runes.perks);
  return {
    primary: treeView(lookup, runes.primaryStyle, picked, false),
    secondary: runes.subStyle === null ? null : treeView(lookup, runes.subStyle, picked, true),
    shards: runes.statPerks,
  };
}

const SHARD_ICONS: Record<number, string> = {
  5001: 'StatModsHealthScalingIcon',
  5002: 'StatModsArmorIcon',
  5003: 'StatModsMagicResIcon',
  5005: 'StatModsAttackSpeedIcon',
  5007: 'StatModsCDRScalingIcon',
  5008: 'StatModsAdaptiveForceIcon',
  5010: 'StatModsMovementSpeedIcon',
  5011: 'StatModsHealthPlusIcon',
  5013: 'StatModsTenacityIcon',
};

// Data Dragon hosts the stat shard icons but lists no shards, so their IDs are mapped here.
export function shardIconUrl(id: number): string | undefined {
  const icon = SHARD_ICONS[id];
  return icon && ddragonUrl.rune(`perk-images/StatMods/${icon}.png`);
}
