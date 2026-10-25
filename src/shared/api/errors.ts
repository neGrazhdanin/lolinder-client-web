import { ErrorCode, type ErrorResponse } from './generated';

export type ErrorMessageKey = `errors.${ErrorCode | 'NETWORK'}`;

function isErrorResponse(error: unknown): error is ErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    Object.values<unknown>(ErrorCode).includes((error as { code?: unknown }).code)
  );
}

export function apiErrorCode(error: unknown): ErrorCode | undefined {
  return isErrorResponse(error) ? error.code : undefined;
}

export function errorMessageKey(error: unknown): ErrorMessageKey {
  if (isErrorResponse(error)) return `errors.${error.code}`;
  // fetch rejects with TypeError when the request never reaches the server
  if (error instanceof TypeError) return 'errors.NETWORK';
  return 'errors.INTERNAL_ERROR';
}

const TRANSIENT: readonly ErrorCode[] = [ErrorCode.INTERNAL_ERROR, ErrorCode.SERVICE_UNAVAILABLE];

/**
 * TanStack Query `retry`: try again on network and server trouble, never on 4xx answers.
 * RATE_LIMITED is a 4xx too: retrying it within seconds only spends the same budget again.
 */
export function retryTransient(failures: number, error: unknown): boolean {
  const code = apiErrorCode(error);
  return failures < 2 && (code === undefined || TRANSIENT.includes(code));
}
