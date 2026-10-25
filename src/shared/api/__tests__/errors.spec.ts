import { describe, expect, it } from 'vitest';
import { errorMessageKey, retryTransient } from '../errors';

describe('errorMessageKey', () => {
  it('maps a known API error code to its message key', () => {
    expect(errorMessageKey({ code: 'RATE_LIMITED' })).toBe('errors.RATE_LIMITED');
  });

  it('treats a failed fetch as a network error', () => {
    expect(errorMessageKey(new TypeError('Failed to fetch'))).toBe('errors.NETWORK');
  });

  it('falls back to INTERNAL_ERROR for unknown shapes', () => {
    expect(errorMessageKey({ code: 'SOMETHING_NEW' })).toBe('errors.INTERNAL_ERROR');
    expect(errorMessageKey(undefined)).toBe('errors.INTERNAL_ERROR');
  });
});

describe('retryTransient', () => {
  it('retries network and server errors twice', () => {
    expect(retryTransient(0, new TypeError('Failed to fetch'))).toBe(true);
    expect(retryTransient(1, { code: 'SERVICE_UNAVAILABLE' })).toBe(true);
    expect(retryTransient(2, { code: 'INTERNAL_ERROR' })).toBe(false);
  });

  it('leaves rate limiting alone', () => {
    expect(retryTransient(0, { code: 'RATE_LIMITED' })).toBe(false);
  });

  it('never retries answers the client caused', () => {
    expect(retryTransient(0, { code: 'PLAYER_NOT_FOUND' })).toBe(false);
    expect(retryTransient(0, { code: 'VALIDATION_FAILED' })).toBe(false);
  });
});
