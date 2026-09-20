import React from 'react';
import { useJwt } from './useJwt';
import type { JwtGuardProps, JwtPayload } from './types';

/**
 * Declarative component for guarding routes or UI sections based on JWT validity and expiration.
 *
 * @example
 * ```tsx
 * // Standard component wrapper
 * <JwtGuard token={token} fallback={<Navigate to="/login" />}>
 *   <Dashboard />
 * </JwtGuard>
 *
 * // Render-prop pattern (accessing user claims directly)
 * <JwtGuard<UserClaims> token={token} fallback={<p>Please sign in</p>}>
 *   {({ payload }) => <h1>Welcome back, {payload?.email}!</h1>}
 * </JwtGuard>
 * ```
 */
export function JwtGuard<T extends JwtPayload = JwtPayload>({
  token,
  children,
  fallback = null,
  onExpire,
}: JwtGuardProps<T>): React.ReactElement | null {
  const auth = useJwt<T>(token, { onExpire });

  // 1. If token is invalid, missing, or expired, render the fallback UI
  if (!auth.isAuthenticated) {
    return <>{fallback}</>;
  }

  // 2. Support Render Props pattern: pass auth state directly into child function
  if (typeof children === 'function') {
    return <>{children(auth)}</>;
  }

  // 3. Render standard children
  return <>{children}</>;
}
