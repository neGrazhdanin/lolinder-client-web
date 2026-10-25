import {
  ErrorCode,
  type ErrorResponse,
  type Player,
  type PlayerSearchPending,
  type PlayersControllerSearchData,
  playersControllerSearch,
} from '@/shared/api';

export type SearchQuery = PlayersControllerSearchData['query'];

export interface SearchResponse {
  status: number;
  data: Player | PlayerSearchPending;
  retryAfter: string | null;
}

export type SearchRequest = (query: SearchQuery, signal?: AbortSignal) => Promise<SearchResponse>;
export type Wait = (ms: number, signal?: AbortSignal) => Promise<void>;

const DEFAULT_RETRY_MS = 2000;
const MIN_RETRY_MS = 500;
const MAX_RETRY_MS = 15_000;
// The API holds each request for a few seconds before answering 202, so this is about a minute.
export const MAX_LOOKUP_ATTEMPTS = 8;

export function parseRetryAfter(header: string | null, now = Date.now()): number | undefined {
  if (!header?.trim()) return undefined;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return seconds * 1000;
  const date = Date.parse(header);
  return Number.isNaN(date) ? undefined : date - now;
}

export function retryDelay(header: string | null, now = Date.now()): number {
  const ms = parseRetryAfter(header, now) ?? DEFAULT_RETRY_MS;
  return Math.min(MAX_RETRY_MS, Math.max(MIN_RETRY_MS, ms));
}

const searchRequest: SearchRequest = async (query, signal) => {
  const { data, response } = await playersControllerSearch({ query, signal, throwOnError: true });
  // readable only when the API lists it in Access-Control-Expose-Headers; retryDelay falls back otherwise
  return { status: response.status, data, retryAfter: response.headers.get('Retry-After') };
};

export const abortableWait: Wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });

export interface LookupOptions {
  signal?: AbortSignal;
  request?: SearchRequest;
  wait?: Wait;
  onPending?: (attempt: number) => void;
}

export async function lookupPlayer(
  query: SearchQuery,
  options: LookupOptions = {},
): Promise<Player> {
  const { signal, request = searchRequest, wait = abortableWait, onPending } = options;

  for (let attempt = 1; ; attempt++) {
    const response = await request(query, signal);
    if (response.status !== 202 && 'puuid' in response.data) return response.data;
    if (attempt >= MAX_LOOKUP_ATTEMPTS) {
      throw { code: ErrorCode.SERVICE_UNAVAILABLE } satisfies ErrorResponse;
    }
    onPending?.(attempt);
    await wait(retryDelay(response.retryAfter), signal);
  }
}
