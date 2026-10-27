import { test as base, type Page, type WebSocketRoute } from '@playwright/test';
import type { ErrorResponse } from '../../src/shared/api/generated/types.gen';
import { staticBundle, VERSION } from './data';

const API = process.env.VITE_API_URL ?? 'http://localhost:3000';
const APP_ORIGIN = `http://localhost:${process.env.CI ? 4173 : 5173}`;

const CORS = {
  'access-control-allow-origin': APP_ORIGIN,
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers': 'content-type',
  'access-control-expose-headers': 'retry-after',
};

// 1×1 transparent PNG for Data Dragon images, so tests never hit the CDN
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

export interface MockResponse {
  status?: number;
  body: unknown;
  headers?: Record<string, string>;
}

type Handler = (request: { url: URL; method: string }) => MockResponse;

export function notFound(code: ErrorResponse['code'] = 'NOT_FOUND'): MockResponse {
  return { status: 404, body: { code } };
}

/** Answers the API by path; unmatched calls get a 404 so a missing mock fails loudly. */
export class MockApi {
  private readonly handlers: { pattern: RegExp; method: string; handle: Handler }[] = [];
  readonly calls: { method: string; path: string }[] = [];

  on(method: string, pattern: RegExp, handle: Handler | MockResponse): this {
    this.handlers.unshift({
      method,
      pattern,
      handle: typeof handle === 'function' ? handle : () => handle,
    });
    return this;
  }

  count(method: string, pattern: RegExp): number {
    return this.calls.filter((call) => call.method === method && pattern.test(call.path)).length;
  }

  async install(page: Page): Promise<void> {
    this.on('GET', /^\/static-data\/latest$/, { body: { version: VERSION } });
    this.on('GET', /^\/static-data\/[\d.]+\/(en|ru)$/, ({ url }) => ({
      body: staticBundle(url.pathname.endsWith('/ru') ? 'ru' : 'en'),
    }));

    await page.route('https://ddragon.leagueoflegends.com/**', (route) =>
      route.fulfill({ contentType: 'image/png', body: PIXEL }),
    );

    await page.route(`${API}/**`, async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.pathname.startsWith('/socket.io/')) return route.fallback();
      if (request.method() === 'OPTIONS') {
        return route.fulfill({
          status: 204,
          headers: { ...CORS, 'access-control-allow-methods': 'GET, POST' },
        });
      }
      this.calls.push({ method: request.method(), path: url.pathname });
      const handler = this.handlers.find(
        (entry) => entry.method === request.method() && entry.pattern.test(url.pathname),
      );
      const response = handler?.handle({ url, method: request.method() }) ?? notFound();
      await route.fulfill({
        status: response.status ?? 200,
        contentType: 'application/json',
        headers: { ...CORS, ...response.headers },
        body: JSON.stringify(response.body),
      });
    });
  }
}

/** A minimal socket.io server speaking Engine.IO v4 over the websocket transport. */
export class MockRealtime {
  private socket: WebSocketRoute | undefined;
  readonly rooms = new Set<string>();

  async install(page: Page): Promise<void> {
    await page.routeWebSocket(/\/socket\.io\//, (ws) => {
      this.socket = ws;
      ws.send(
        `0${JSON.stringify({ sid: 'e2e', upgrades: [], pingInterval: 60_000, pingTimeout: 60_000, maxPayload: 1e6 })}`,
      );
      ws.onMessage((message) => {
        const text = String(message);
        if (text.startsWith('40')) return ws.send(`40${JSON.stringify({ sid: 'e2e-socket' })}`);
        const event = /^42(\d*)(.*)$/.exec(text);
        if (!event) return;
        const [, ackId, json] = event;
        const [name, payload] = JSON.parse(json ?? '[]') as [string, { puuid: string }];
        if (name === 'player:subscribe') this.rooms.add(payload.puuid);
        if (name === 'player:unsubscribe') this.rooms.delete(payload.puuid);
        if (ackId) ws.send(`43${ackId}[true]`);
      });
    });
  }

  playerUpdated(puuid: string): void {
    this.emit('player:updated', puuid);
  }

  matchesUpdated(puuid: string): void {
    this.emit('player:matches-updated', puuid);
  }

  private emit(event: string, puuid: string): void {
    if (!this.socket) throw new Error('no socket connected');
    this.socket.send(`42${JSON.stringify([event, { puuid }])}`);
  }
}

export const test = base.extend<{ api: MockApi; realtime: MockRealtime }>({
  api: [
    async ({ page }, use) => {
      const api = new MockApi();
      await api.install(page);
      await use(api);
    },
    { auto: true },
  ],
  realtime: [
    async ({ page }, use) => {
      const realtime = new MockRealtime();
      await realtime.install(page);
      await use(realtime);
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
