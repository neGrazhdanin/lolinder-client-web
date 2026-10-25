import type { PlayerSync } from '@/shared/api';

export type SyncState = 'first-sync' | 'syncing' | 'fresh' | 'stale' | 'never';

export function syncState(sync: PlayerSync): SyncState {
  if (sync.status === 'syncing') return sync.lastSyncedAt ? 'syncing' : 'first-sync';
  return sync.lastSyncedAt ? sync.status : 'never';
}

/** Ranks and masteries are empty placeholders until the first sync, not real "unranked" data. */
export function awaitingFirstSync(sync: PlayerSync): boolean {
  return sync.status === 'syncing' && sync.lastSyncedAt === null;
}

/** A refresh inside the API's cooldown returns stored data without queueing a sync. */
export function refreshWasQueued(sync: PlayerSync): boolean {
  return sync.status === 'syncing';
}

export function syncFinished(previous: PlayerSync | undefined, next: PlayerSync): boolean {
  return previous?.status === 'syncing' && next.status !== 'syncing';
}
