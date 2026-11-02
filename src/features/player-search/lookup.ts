import {
  abortableWait,
  ErrorCode,
  type ErrorResponse,
  type Player,
  type PlayerSearchPending,
  type PlayersControllerSearchData,
  playersControllerSearch,
  retryDelay,
  type Wait,
} from '@/shared/api';

export { abortableWait, parseRetryAfter, retryDelay, type Wait } from '@/shared/api';

export type SearchQuery = PlayersControllerSearchData['query'];

export interface SearchResponse {
  status: number;
  data: Player | PlayerSearchPending;
  retryAfter: string | null;
}

export type SearchRequest = (query: SearchQuery, signal?: AbortSignal) => Promise<SearchResponse>;
// The API holds each request for a few seconds before answering 202, so this is about a minute.
export const MAX_LOOKUP_ATTEMPTS = 8;

const searchRequest: SearchRequest = async (query, signal) => {
  const { data, response } = await playersControllerSearch({ query, signal, throwOnError: true });
  // readable only when the API lists it in Access-Control-Expose-Headers; retryDelay falls back otherwise
  return { status: response.status, data, retryAfter: response.headers.get('Retry-After') };
};

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
