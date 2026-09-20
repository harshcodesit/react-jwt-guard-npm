import type { ReactNode } from 'react';

export interface JwtPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]: unknown;
}

export interface UseJwtOptions {
  onExpire?: () => void;
}

export interface UseJwtResult<T extends JwtPayload = JwtPayload> {
  payload: T | null;
  isExpired: boolean;
  timeUntilExpiry: number | null;
  isValid: boolean;
  isAuthenticated: boolean;
}

export interface JwtGuardProps<T extends JwtPayload = JwtPayload> {
  token?: string | null;
  children: ReactNode | ((result: UseJwtResult<T>) => ReactNode);
  fallback?: ReactNode;
  onExpire?: () => void;
}
