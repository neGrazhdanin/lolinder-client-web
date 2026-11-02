export type Wait = (ms: number, signal?: AbortSignal) => Promise<void>;

const DEFAULT_RETRY_MS = 2000;
const MIN_RETRY_MS = 500;
const MAX_RETRY_MS = 15_000;

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
