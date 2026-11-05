import { describe, expect, it } from 'vitest';
import type { StaticDataBundle } from '@/shared/api';
import { createStaticLookup } from '@/shared/static-data';
import { runePage, shardIconUrl } from '../runes';

const rune = (id: number) => ({ id, key: `R${id}`, name: `Rune ${id}`, icon: `${id}.png` });

const lookup = createStaticLookup({
  version: '16.21.1',
  locale: 'en',
  champions: [],
  items: [],
  summonerSpells: [],
  runeTrees: [
    {
      id: 8100,
      key: 'Domination',
      name: 'Domination',
      icon: 'domination.png',
      slots: [[rune(8112), rune(8128)], [rune(8126), rune(8139)], [rune(8136)], [rune(8135)]],
    },
    {
      id: 8200,
      key: 'Sorcery',
      name: 'Sorcery',
      icon: 'sorcery.png',
      slots: [[rune(8214)], [rune(8226), rune(8275)], [rune(8210)], [rune(8237)]],
    },
  ],
} satisfies StaticDataBundle);

describe('runePage', () => {
  it('marks the picked runes in the full primary tree and the secondary tree without keystones', () => {
    const page = runePage(
      {
        primaryStyle: 8100,
        subStyle: 8200,
        perks: [8112, 8139, 8136, 8135, 8275, 8237],
        statPerks: [5008, 5008, 5001],
      },
      lookup,
    );

    const picked = (rows: { id: number; picked: boolean }[][] | undefined) =>
      rows?.map((row) => row.filter((option) => option.picked).map((option) => option.id));
    expect(picked(page?.primary.rows)).toEqual([[8112], [8139], [8136], [8135]]);
    expect(picked(page?.secondary?.rows)).toEqual([[8275], [], [8237]]);
    expect(page?.secondary?.rows[0]?.map((option) => option.id)).toEqual([8226, 8275]);
    expect(page?.shards).toEqual([5008, 5008, 5001]);
  });

  it('returns null for modes without runes', () => {
    expect(
      runePage({ primaryStyle: null, subStyle: null, perks: [], statPerks: [] }, lookup),
    ).toBeNull();
  });

  it('keeps the tree ID when the patch data does not know it yet', () => {
    const page = runePage({ primaryStyle: 9999, subStyle: null, perks: [], statPerks: [] }, lookup);
    expect(page?.primary).toEqual({ id: 9999, entry: undefined, rows: [] });
  });
});

describe('shardIconUrl', () => {
  it('maps known shards to Data Dragon icons', () => {
    expect(shardIconUrl(5008)).toBe(
      'https://ddragon.leagueoflegends.com/cdn/img/perk-images/StatMods/StatModsAdaptiveForceIcon.png',
    );
    expect(shardIconUrl(1234)).toBeUndefined();
  });
});
