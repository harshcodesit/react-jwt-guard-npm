import { useState, useEffect, useMemo, useRef } from 'react';
import { decodeJwt } from './decode';
import type { JwtPayload, UseJwtOptions, UseJwtResult } from './types';

export function useJwt<T extends JwtPayload = JwtPayload>(
  token?: string | null,
  options?: UseJwtOptions
): UseJwtResult<T> {
  const payload = useMemo(() => decodeJwt<T>(token), [token]);

  const isValid = useMemo(() => {
    if (!token || typeof token !== 'string') return false;
    return token.trim().split('.').length === 3 && payload !== null;
  }, [token, payload]);

  const checkExpired = (): boolean => {
    if (!payload || typeof payload.exp !== 'number') return true;
    return Date.now() >= payload.exp * 1000;
  };

  const [isExpired, setIsExpired] = useState<boolean>(() => checkExpired());

  // Prevent stale closures when parent passes inline onExpire callback
  const onExpireRef = useRef(options?.onExpire);
  useEffect(() => {
    onExpireRef.current = options?.onExpire;
  }, [options?.onExpire]);

  useEffect(() => {
    const expired = checkExpired();
    setIsExpired(expired);

    if (!payload || typeof payload.exp !== 'number' || expired) return;

    const delay = payload.exp * 1000 - Date.now();

    const timer = setTimeout(() => {
      setIsExpired(true);
      onExpireRef.current?.();
    }, delay);

    return () => clearTimeout(timer);
  }, [token, payload]);

  const timeUntilExpiry = useMemo(() => {
    if (!payload || typeof payload.exp !== 'number' || isExpired) return null;
    const diff = payload.exp * 1000 - Date.now();
    return diff > 0 ? Math.floor(diff / 1000) : 0;
  }, [payload, isExpired]);

  const isAuthenticated = isValid && !isExpired;

  return {
    payload,
    isExpired,
    timeUntilExpiry,
    isValid,
    isAuthenticated
  };
}
