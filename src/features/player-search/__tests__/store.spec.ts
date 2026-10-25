import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { type RecentPlayer, usePlayerSearchStore } from '../store';

const player = (id: number): RecentPlayer => ({
  puuid: `p${id}`.padEnd(78, '0'),
  gameName: `Player${id}`,
  tagLine: 'EUW',
  platform: 'euw1',
  profileIconId: id,
});

describe('recent players', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('puts the latest player first without duplicates', () => {
    const store = usePlayerSearchStore();
    store.remember(player(1));
    store.remember(player(2));
    store.remember(player(1));

    expect(store.recent.map((entry) => entry.gameName)).toEqual(['Player1', 'Player2']);
  });

  it('keeps the six most recent players', () => {
    const store = usePlayerSearchStore();
    for (let id = 1; id <= 8; id++) store.remember(player(id));

    expect(store.recent).toHaveLength(6);
    expect(store.recent[0]?.gameName).toBe('Player8');
  });

  it('forgets a player', () => {
    const store = usePlayerSearchStore();
    store.remember(player(1));
    store.remember(player(2));
    store.forget(player(1).puuid);

    expect(store.recent.map((entry) => entry.gameName)).toEqual(['Player2']);
  });

  it('drops entries in storage that are not recent players', () => {
    localStorage.setItem(
      'lolinder-recent-players',
      JSON.stringify([
        player(1),
        { ...player(2), platform: 'xx1' },
        { ...player(3), profileIconId: '../evil' },
        null,
      ]),
    );
    const store = usePlayerSearchStore();

    expect(store.recent.map((entry) => entry.gameName)).toEqual(['Player1']);
  });
});
