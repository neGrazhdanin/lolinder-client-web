import { ErrorCode, type ErrorResponse } from './generated';

export type ErrorMessageKey = `errors.${ErrorCode | 'NETWORK'}`;

function isErrorResponse(error: unknown): error is ErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    Object.values<unknown>(ErrorCode).includes((error as { code?: unknown }).code)
  );
}

export function errorMessageKey(error: unknown): ErrorMessageKey {
  if (isErrorResponse(error)) return `errors.${error.code}`;
  // fetch rejects with TypeError when the request never reaches the server
  if (error instanceof TypeError) return 'errors.NETWORK';
  return 'errors.INTERNAL_ERROR';
}
