import { describe, it, expect, vi } from 'vitest';
import { decodeJwt, isTokenExpired, getTokenRemainingSeconds } from '../src/decode';

// Helper to create mock JWTs without external libraries
function createMockJwt(header: object, payload: object, signature = 'signature'): string {
  const b64 = (obj: object) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  return `${b64(header)}.${b64(payload)}.${signature}`;
}

describe('decodeJwt', () => {
  it('should decode a valid JWT payload correctly', () => {
    const mockPayload = { sub: '12345', email: 'dev@mern.com', role: 'admin' };
    const token = createMockJwt({ alg: 'HS256', typ: 'JWT' }, mockPayload);

    const result = decodeJwt<typeof mockPayload>(token);
    expect(result).toEqual(mockPayload);
  });

  it('should safely handle base64url characters (- and _)', () => {
    const mockPayload = { subject: '??>>??>>', test: 'base64url_test-data' };
    const token = createMockJwt({ alg: 'HS256' }, mockPayload);

    const result = decodeJwt<typeof mockPayload>(token);
    expect(result).toEqual(mockPayload);
  });

  it('should safely decode multi-byte Unicode characters', () => {
    const mockPayload = { name: 'Hélène Müller 🚀', city: '東京' };
    const token = createMockJwt({ alg: 'HS256' }, mockPayload);

    const result = decodeJwt<typeof mockPayload>(token);
    expect(result).toEqual(mockPayload);
  });

  it('should return null for malformed or non-string tokens', () => {
    expect(decodeJwt(null)).toBeNull();
    expect(decodeJwt(undefined)).toBeNull();
    expect(decodeJwt('')).toBeNull();
    expect(decodeJwt('not.a.valid.jwt.token')).toBeNull();
    expect(decodeJwt('invalid-single-string')).toBeNull();
    expect(decodeJwt('part1.corruptedBase64!@#$.part3')).toBeNull();
  });
});

describe('isTokenExpired', () => {
  it('should return false for future expiration', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
    const token = createMockJwt({ alg: 'HS256' }, { exp: futureExp });

    expect(isTokenExpired(token)).toBe(false);
  });

  it('should return true for past expiration', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 60; // 1 minute in past
    const token = createMockJwt({ alg: 'HS256' }, { exp: pastExp });

    expect(isTokenExpired(token)).toBe(true);
  });

  it('should return true for invalid token or missing exp', () => {
    const tokenWithoutExp = createMockJwt({ alg: 'HS256' }, { sub: '123' });
    expect(isTokenExpired(tokenWithoutExp)).toBe(true);
    expect(isTokenExpired('invalid-token')).toBe(true);
  });
});

describe('getTokenRemainingSeconds', () => {
  it('should calculate remaining seconds correctly', () => {
    const nowInSeconds = 1700000000;
    vi.setSystemTime(new Date(nowInSeconds * 1000));

    const token = createMockJwt({ alg: 'HS256' }, { exp: nowInSeconds + 120 });
    expect(getTokenRemainingSeconds(token)).toBe(120);

    vi.useRealTimers();
  });

  it('should return 0 when token is already expired', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 10;
    const token = createMockJwt({ alg: 'HS256' }, { exp: pastExp });
    expect(getTokenRemainingSeconds(token)).toBe(0);
  });

  it('should return null when token has no exp or is invalid', () => {
    expect(getTokenRemainingSeconds(null)).toBeNull();
    expect(getTokenRemainingSeconds('invalid')).toBeNull();
  });
});
