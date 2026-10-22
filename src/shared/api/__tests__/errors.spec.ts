import { describe, expect, it } from 'vitest';
import { errorMessageKey } from '../errors';

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
