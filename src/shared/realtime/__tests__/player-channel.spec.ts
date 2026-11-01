import { describe, expect, it, vi } from 'vitest';
import { createPlayerChannel, type PlayerSocket } from '../player-channel';

type Handler = (payload?: unknown) => void;

function fakeSocket() {
  const handlers = new Map<string, Handler[]>();
  const socket = {
    connected: false,
    active: false,
    emit: vi.fn<(event: string, payload: unknown, ack?: (joined: boolean) => void) => void>(
      (_event, _payload, ack) => ack?.(true),
    ),
    connect: vi.fn<() => void>(() => {
      socket.active = true;
    }),
    on: (event: string, handler: Handler) => {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
      return socket;
    },
  };
  return {
    socket,
    asPlayerSocket: socket as unknown as PlayerSocket,
    serverConnects() {
      socket.connected = true;
      handlers.get('connect')?.forEach((handler) => handler());
    },
    serverDrops(reason = 'transport close') {
      socket.connected = false;
      socket.active = reason !== 'io server disconnect';
      handlers.get('disconnect')?.forEach((handler) => handler(reason));
    },
    serverEmits(event: string, payload: unknown) {
      handlers.get(event)?.forEach((handler) => handler(payload));
    },
  };
}

const listener = () => ({
  onUpdated: vi.fn<() => void>(),
  onMatchesUpdated: vi.fn<() => void>(),
  onJoined: vi.fn<(afterReconnect: boolean) => void>(),
});

describe('createPlayerChannel', () => {
  it('connects lazily and subscribes once the socket is up', () => {
    const fake = fakeSocket();
    const channel = createPlayerChannel(fake.asPlayerSocket);

    channel.subscribe('a', listener());
    expect(fake.socket.connect).toHaveBeenCalledOnce();
    expect(fake.socket.emit).not.toHaveBeenCalled();

    fake.serverConnects();
    expect(fake.socket.emit).toHaveBeenCalledWith(
      'player:subscribe',
      { puuid: 'a' },
      expect.any(Function),
    );
  });

  it('reports the join once the server acknowledges it', () => {
    const fake = fakeSocket();
    const channel = createPlayerChannel(fake.asPlayerSocket);
    const a = listener();
    channel.subscribe('a', a);
    expect(a.onJoined).not.toHaveBeenCalled();

    fake.serverConnects();
    expect(a.onJoined).toHaveBeenCalledExactlyOnceWith(false);
  });

  it('shares one room per player and leaves it with the last listener', () => {
    const fake = fakeSocket();
    const channel = createPlayerChannel(fake.asPlayerSocket);
    fake.serverConnects();

    const first = channel.subscribe('a', listener());
    const second = channel.subscribe('a', listener());
    expect(fake.socket.emit).toHaveBeenCalledTimes(1);

    first();
    expect(fake.socket.emit).toHaveBeenCalledTimes(1);
    second();
    expect(fake.socket.emit).toHaveBeenLastCalledWith('player:unsubscribe', { puuid: 'a' });
  });

  it('routes player:updated to that player only', () => {
    const fake = fakeSocket();
    const channel = createPlayerChannel(fake.asPlayerSocket);
    const a = listener();
    const b = listener();
    channel.subscribe('a', a);
    channel.subscribe('b', b);
    fake.serverConnects();

    fake.serverEmits('player:updated', { puuid: 'a' });
    expect(a.onUpdated).toHaveBeenCalledOnce();
    expect(b.onUpdated).not.toHaveBeenCalled();
  });

  it('routes player:matches-updated apart from profile updates', () => {
    const fake = fakeSocket();
    const channel = createPlayerChannel(fake.asPlayerSocket);
    const a = listener();
    const b = listener();
    channel.subscribe('a', a);
    channel.subscribe('b', b);
    fake.serverConnects();

    fake.serverEmits('player:matches-updated', { puuid: 'a' });
    expect(a.onMatchesUpdated).toHaveBeenCalledOnce();
    expect(a.onUpdated).not.toHaveBeenCalled();
    expect(b.onMatchesUpdated).not.toHaveBeenCalled();
  });

  it('rejoins rooms after a reconnect and flags that events were missed', () => {
    const fake = fakeSocket();
    const channel = createPlayerChannel(fake.asPlayerSocket);
    const a = listener();
    channel.subscribe('a', a);
    fake.serverConnects();

    fake.serverDrops();
    fake.socket.emit.mockClear();
    fake.serverConnects();

    expect(fake.socket.emit).toHaveBeenCalledWith(
      'player:subscribe',
      { puuid: 'a' },
      expect.any(Function),
    );
    expect(a.onJoined).toHaveBeenLastCalledWith(true);
  });

  it('reconnects itself when the server closed the connection', () => {
    const fake = fakeSocket();
    const channel = createPlayerChannel(fake.asPlayerSocket);
    channel.subscribe('a', listener());
    fake.serverConnects();
    fake.socket.connect.mockClear();

    fake.serverDrops('io server disconnect');
    expect(fake.socket.connect).toHaveBeenCalledOnce();
  });

  it('ignores malformed player event payloads', () => {
    const fake = fakeSocket();
    const channel = createPlayerChannel(fake.asPlayerSocket);
    const a = listener();
    channel.subscribe('a', a);
    fake.serverConnects();

    expect(() => fake.serverEmits('player:updated', null)).not.toThrow();
    expect(() => fake.serverEmits('player:matches-updated', { puuid: 7 })).not.toThrow();
    expect(a.onUpdated).not.toHaveBeenCalled();
    expect(a.onMatchesUpdated).not.toHaveBeenCalled();
  });

  it('does not emit an unsubscribe while offline', () => {
    const fake = fakeSocket();
    const channel = createPlayerChannel(fake.asPlayerSocket);
    const unsubscribe = channel.subscribe('a', listener());
    unsubscribe();
    expect(fake.socket.emit).not.toHaveBeenCalled();
  });
});
