import type { Champion, Item, Rune, RuneTree, StaticDataBundle, SummonerSpell } from '@/shared/api';
import { ddragonUrl } from './ddragon';

export interface StaticEntry {
  id: number;
  name: string;
  iconUrl: string;
}

export interface StaticLookup {
  version: string;
  champion(id: number): (StaticEntry & { key: string; title: string }) | undefined;
  item(id: number): StaticEntry | undefined;
  rune(id: number): StaticEntry | undefined;
  runeTree(id: number): StaticEntry | undefined;
  summonerSpell(id: number): StaticEntry | undefined;
}

function indexById<T extends { id: number }, R>(entries: readonly T[], map: (entry: T) => R) {
  return new Map(entries.map((entry) => [entry.id, map(entry)]));
}

export function createStaticLookup(bundle: StaticDataBundle): StaticLookup {
  const { version } = bundle;

  const champions = indexById(bundle.champions, (champion: Champion) => ({
    id: champion.id,
    key: champion.key,
    name: champion.name,
    title: champion.title,
    iconUrl: ddragonUrl.champion(version, champion.image),
  }));
  const items = indexById(bundle.items, (item: Item) => ({
    id: item.id,
    name: item.name,
    iconUrl: ddragonUrl.item(version, item.image),
  }));
  const spells = indexById(bundle.summonerSpells, (spell: SummonerSpell) => ({
    id: spell.id,
    name: spell.name,
    iconUrl: ddragonUrl.summonerSpell(version, spell.image),
  }));
  const toRune = (rune: Rune | RuneTree) => ({
    id: rune.id,
    name: rune.name,
    iconUrl: ddragonUrl.rune(rune.icon),
  });
  const trees = indexById(bundle.runeTrees, toRune);
  const runes = indexById(
    bundle.runeTrees.flatMap((tree) => tree.slots.flat()),
    toRune,
  );

  return {
    version,
    champion: (id) => champions.get(id),
    item: (id) => items.get(id),
    rune: (id) => runes.get(id),
    runeTree: (id) => trees.get(id),
    summonerSpell: (id) => spells.get(id),
  };
}
