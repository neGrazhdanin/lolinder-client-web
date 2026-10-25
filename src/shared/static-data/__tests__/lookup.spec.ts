import { describe, expect, it } from 'vitest';
import type { StaticDataBundle } from '@/shared/api';
import { createStaticLookup } from '../lookup';

const bundle: StaticDataBundle = {
  version: '16.21.1',
  locale: 'ru',
  champions: [
    { id: 103, key: 'Ahri', name: 'Ари', title: 'Девятихвостая лиса', image: 'Ahri.png' },
  ],
  items: [
    {
      id: 3089,
      name: 'Смертельная шляпа Рабадона',
      plaintext: '',
      gold: 3500,
      image: '3089.png',
      tags: [],
      from: [],
      into: [],
    },
  ],
  runeTrees: [
    {
      id: 8100,
      key: 'Domination',
      name: 'Доминирование',
      icon: 'perk-images/Styles/7200_Domination.png',
      slots: [
        [
          {
            id: 8112,
            key: 'Electrocute',
            name: 'Казнь электричеством',
            icon: 'perk-images/Styles/Domination/Electrocute/Electrocute.png',
          },
        ],
      ],
    },
  ],
  summonerSpells: [{ id: 4, key: 'SummonerFlash', name: 'Скачок', image: 'SummonerFlash.png' }],
};

describe('createStaticLookup', () => {
  const lookup = createStaticLookup(bundle);

  it('resolves champions by numeric ID with a versioned icon', () => {
    expect(lookup.champion(103)).toEqual({
      id: 103,
      key: 'Ahri',
      name: 'Ари',
      title: 'Девятихвостая лиса',
      iconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.21.1/img/champion/Ahri.png',
    });
  });

  it('resolves items and summoner spells', () => {
    expect(lookup.item(3089)?.iconUrl).toBe(
      'https://ddragon.leagueoflegends.com/cdn/16.21.1/img/item/3089.png',
    );
    expect(lookup.summonerSpell(4)).toMatchObject({
      name: 'Скачок',
      iconUrl: 'https://ddragon.leagueoflegends.com/cdn/16.21.1/img/spell/SummonerFlash.png',
    });
  });

  it('resolves rune trees and the runes nested in their slots from the unversioned path', () => {
    expect(lookup.runeTree(8100)?.iconUrl).toBe(
      'https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/7200_Domination.png',
    );
    expect(lookup.rune(8112)?.name).toBe('Казнь электричеством');
  });

  it('returns undefined for IDs from a newer patch', () => {
    expect(lookup.champion(999)).toBeUndefined();
    expect(lookup.rune(8100)).toBeUndefined();
  });
});
