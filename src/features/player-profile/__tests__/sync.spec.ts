import { describe, expect, it } from 'vitest';
import type { PlayerSync } from '@/shared/api';
import { awaitingFirstSync, refreshWasQueued, syncFinished, syncState } from '../sync';
import { isPlayerQuery } from '../useLivePlayer';

const at = '2026-10-25T12:00:00.000Z';
const sync = (status: PlayerSync['status'], lastSyncedAt: string | null = at): PlayerSync => ({
  status,
  lastSyncedAt,
});

describe('syncState', () => {
  it('tells a first sync apart from a refresh of stored data', () => {
    expect(syncState(sync('syncing', null))).toBe('first-sync');
    expect(syncState(sync('syncing'))).toBe('syncing');
  });

  it('passes fresh and stale through when data exists', () => {
    expect(syncState(sync('fresh'))).toBe('fresh');
    expect(syncState(sync('stale'))).toBe('stale');
  });

  it('reports never-synced players that are not syncing', () => {
    expect(syncState(sync('stale', null))).toBe('never');
  });
});

describe('awaitingFirstSync', () => {
  it('is true only while the very first sync runs', () => {
    expect(awaitingFirstSync(sync('syncing', null))).toBe(true);
    expect(awaitingFirstSync(sync('syncing'))).toBe(false);
    expect(awaitingFirstSync(sync('stale', null))).toBe(false);
  });
});

describe('refreshWasQueued', () => {
  it('is false when the API answered from its cooldown window', () => {
    expect(refreshWasQueued(sync('syncing'))).toBe(true);
    expect(refreshWasQueued(sync('fresh'))).toBe(false);
  });
});

describe('syncFinished', () => {
  it('fires on the transition out of syncing', () => {
    expect(syncFinished(sync('syncing'), sync('fresh'))).toBe(true);
    expect(syncFinished(sync('syncing'), sync('stale'))).toBe(true);
  });

  it('ignores the first load and unchanged states', () => {
    expect(syncFinished(undefined, sync('fresh'))).toBe(false);
    expect(syncFinished(sync('fresh'), sync('fresh'))).toBe(false);
    expect(syncFinished(sync('syncing'), sync('syncing'))).toBe(false);
  });
});

describe('isPlayerQuery', () => {
  const puuid = 'p'.repeat(78);

  it('matches generated queries by the puuid path parameter', () => {
    expect(
      isPlayerQuery({ queryKey: [{ _id: 'playersControllerProfile', path: { puuid } }] }, puuid),
    ).toBe(true);
    expect(
      isPlayerQuery(
        {
          queryKey: [
            { _id: 'playersControllerRankHistory', path: { puuid }, query: { queue: 'solo' } },
          ],
        },
        puuid,
      ),
    ).toBe(true);
  });

  it('leaves other players and static data alone', () => {
    expect(isPlayerQuery({ queryKey: [{ _id: 'x', path: { puuid: 'other' } }] }, puuid)).toBe(
      false,
    );
    expect(isPlayerQuery({ queryKey: [{ _id: 'staticDataControllerLatest' }] }, puuid)).toBe(false);
    expect(isPlayerQuery({ queryKey: ['players', 'lookup'] }, puuid)).toBe(false);
  });
});
