import type { MatchesControllerHistoryData } from '@/shared/api';

export type MatchQueue = NonNullable<NonNullable<MatchesControllerHistoryData['query']>['queue']>;

export const MATCH_QUEUES: readonly MatchQueue[] = ['solo', 'flex', 'normal', 'aram', 'arena'];

export type QueueName =
  | 'solo'
  | 'flex'
  | 'draft'
  | 'blind'
  | 'quickplay'
  | 'swiftplay'
  | 'aram'
  | 'aramMayhem'
  | 'arena'
  | 'clash'
  | 'aramClash'
  | 'coop'
  | 'urf'
  | 'oneForAll'
  | 'nexusBlitz'
  | 'spellbook'
  | 'custom'
  | 'other';

// https://static.developer.riotgames.com/docs/lol/queues.json
const QUEUE_NAMES = new Map<number, QueueName>([
  [0, 'custom'],
  [400, 'draft'],
  [420, 'solo'],
  [430, 'blind'],
  [440, 'flex'],
  [450, 'aram'],
  [480, 'swiftplay'],
  [490, 'quickplay'],
  [700, 'clash'],
  [720, 'aramClash'],
  [830, 'coop'],
  [840, 'coop'],
  [850, 'coop'],
  [870, 'coop'],
  [880, 'coop'],
  [890, 'coop'],
  [900, 'urf'],
  [1020, 'oneForAll'],
  [1300, 'nexusBlitz'],
  [1400, 'spellbook'],
  [1700, 'arena'],
  [1710, 'arena'],
  [1900, 'urf'],
  [2400, 'aramMayhem'],
]);

export function queueName(queueId: number): QueueName {
  return QUEUE_NAMES.get(queueId) ?? 'other';
}
