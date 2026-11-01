import { io, type Socket } from 'socket.io-client';
import type { ErrorResponse } from '@/shared/api';

interface PlayerEvent {
  puuid: string;
}

interface ServerEvents {
  'player:updated': (event: PlayerEvent) => void;
  'player:matches-updated': (event: PlayerEvent) => void;
  exception: (error: ErrorResponse) => void;
}

interface ClientEvents {
  'player:subscribe': (event: PlayerEvent, ack: (joined: boolean) => void) => void;
  'player:unsubscribe': (event: PlayerEvent) => void;
}

export type PlayerSocket = Socket<ServerEvents, ClientEvents>;

export interface PlayerListener {
  onUpdated(): void;
  /** The match history gained games, or the job loading them gave up. */
  onMatchesUpdated(): void;
  /**
   * The room is joined; events sent before this moment never reach the client. `afterReconnect`
   * means the socket dropped in between, so anything may have changed meanwhile.
   */
  onJoined(afterReconnect: boolean): void;
}

export interface PlayerChannel {
  subscribe(puuid: string, listener: PlayerListener): () => void;
}

export function createPlayerChannel(socket: PlayerSocket): PlayerChannel {
  const listeners = new Map<string, Set<PlayerListener>>();
  let wasConnected = false;

  function join(puuid: string, afterReconnect: boolean): void {
    socket.emit('player:subscribe', { puuid }, () => {
      listeners.get(puuid)?.forEach((listener) => listener.onJoined(afterReconnect));
    });
  }

  // Rooms live on the server-side socket, so a new connection has to join them again.
  socket.on('connect', () => {
    for (const puuid of listeners.keys()) join(puuid, wasConnected);
    wasConnected = true;
  });

  // socket.io retries dropped connections by itself, but not ones the server closed.
  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect' && listeners.size > 0) socket.connect();
  });

  function route(event: PlayerEvent | undefined, notify: (listener: PlayerListener) => void) {
    if (typeof event?.puuid !== 'string') return;
    listeners.get(event.puuid)?.forEach(notify);
  }

  socket.on('player:updated', (event) => route(event, (listener) => listener.onUpdated()));
  socket.on('player:matches-updated', (event) =>
    route(event, (listener) => listener.onMatchesUpdated()),
  );

  return {
    subscribe(puuid, listener) {
      let set = listeners.get(puuid);
      if (!set) {
        set = new Set();
        listeners.set(puuid, set);
        // while offline the connect handler joins; emitting now would be buffered and sent twice
        if (socket.connected) join(puuid, false);
      }
      set.add(listener);
      if (!socket.connected && !socket.active) socket.connect();

      return () => {
        set.delete(listener);
        if (set.size > 0 || listeners.get(puuid) !== set) return;
        listeners.delete(puuid);
        if (socket.connected) socket.emit('player:unsubscribe', { puuid });
      };
    },
  };
}

let channel: PlayerChannel | undefined;

export function playerChannel(): PlayerChannel {
  channel ??= createPlayerChannel(
    io(import.meta.env.VITE_API_URL, {
      autoConnect: false,
      withCredentials: true,
      // API instances share rooms through Redis but not polling sessions, so skip the polling handshake
      transports: ['websocket'],
    }),
  );
  return channel;
}
