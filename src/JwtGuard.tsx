import React from 'react';
import { useJwt } from './useJwt';
import type { JwtGuardProps, JwtPayload } from './types';

export function JwtGuard<T extends JwtPayload = JwtPayload>({
  token,
  children,
  fallback = null,
  onExpire
}: JwtGuardProps<T>): React.ReactElement | null {
  const auth = useJwt<T>(token, { onExpire });

  if (!auth.isAuthenticated) {
    return <>{fallback}</>;
  }

  if (typeof children === 'function') {
    return <>{children(auth)}</>;
  }

  return <>{children}</>;
}
