import { describe, expect, it } from 'vitest';
import { queueName } from '../queues';

describe('queueName', () => {
  it('names the queues the history filter offers', () => {
    expect(queueName(420)).toBe('solo');
    expect(queueName(440)).toBe('flex');
    expect(queueName(400)).toBe('draft');
    expect(queueName(450)).toBe('aram');
    expect(queueName(1700)).toBe('arena');
    expect(queueName(480)).toBe('swiftplay');
    expect(queueName(2400)).toBe('aramMayhem');
  });

  it('groups queues that differ only in bot difficulty or player count', () => {
    expect(queueName(840)).toBe('coop');
    expect(queueName(890)).toBe('coop');
    expect(queueName(1710)).toBe('arena');
  });

  it('falls back to a generic name for event queues it does not know', () => {
    expect(queueName(9999)).toBe('other');
  });
});
