import { useState, useEffect, useMemo, useRef } from 'react';
import { decodeJwt } from './decode';
import type { JwtPayload, UseJwtOptions, UseJwtResult } from './types';

/**
 * Custom React hook for decoding JWTs and tracking live expiration.
 *
 * @template T - Custom payload type extending JwtPayload
 * @param token - Raw JWT string (can be null/undefined while loading)
 * @param options - Hook configuration options (e.g. onExpire callback)
 * @returns UseJwtResult<T> containing payload, expiration status, and helper flags
 */
export function useJwt<T extends JwtPayload = JwtPayload>(
  token?: string | null,
  options?: UseJwtOptions
): UseJwtResult<T> {
  // 1. Memoize token decoding so it only re-runs when the token string changes
  const payload = useMemo(() => decodeJwt<T>(token), [token]);

  // 2. Validate token structure (must be a string with 3 parts)
  const isValid = useMemo(() => {
    if (!token || typeof token !== 'string') return false;
    return token.trim().split('.').length === 3 && payload !== null;
  }, [token, payload]);

  // 3. Helper to determine if the token is currently expired
  const computeIsExpired = (): boolean => {
    if (!payload || typeof payload.exp !== 'number') return true;
    return Date.now() >= payload.exp * 1000;
  };

  const [isExpired, setIsExpired] = useState<boolean>(() => computeIsExpired());

  // 4. Prevent stale closure bugs with onExpire using a mutable ref
  const onExpireRef = useRef(options?.onExpire);
  useEffect(() => {
    onExpireRef.current = options?.onExpire;
  }, [options?.onExpire]);

  // 5. Watch token changes and manage expiration timer
  useEffect(() => {
    const expiredNow = computeIsExpired();
    setIsExpired(expiredNow);

    // If invalid, missing, or already expired, no timer needed
    if (!payload || typeof payload.exp !== 'number' || expiredNow) {
      return;
    }

    const expiryTimeMs = payload.exp * 1000;
    const delayMs = expiryTimeMs - Date.now();

    // 6. Set timer for exact moment of expiration
    const timerId = setTimeout(() => {
      setIsExpired(true);
      if (onExpireRef.current) {
        onExpireRef.current();
      }
    }, delayMs);

    // 7. Cleanup: clear timer when component unmounts or token changes
    return () => clearTimeout(timerId);
  }, [token, payload]);

  // 8. Compute remaining seconds
  const timeUntilExpiry = useMemo(() => {
    if (!payload || typeof payload.exp !== 'number' || isExpired) {
      return null;
    }
    const remainingMs = payload.exp * 1000 - Date.now();
    return remainingMs > 0 ? Math.floor(remainingMs / 1000) : 0;
  }, [payload, isExpired]);

  // 9. Convenience flag: true only if valid, present, and NOT expired
  const isAuthenticated = isValid && !isExpired;

  return {
    payload,
    isExpired,
    timeUntilExpiry,
    isValid,
    isAuthenticated
  };
}
