import type { ReactNode } from 'react';

/**
 * Standard JWT claims defined by RFC 7519
 */
export interface JwtPayload {
  /** Issuer of the JWT */
  iss?: string;
  /** Subject of the JWT (usually the user ID) */
  sub?: string;
  /** Recipient for which the JWT is intended */
  aud?: string | string[];
  /** Expiration time (in seconds since Unix epoch) */
  exp?: number;
  /** "Not Before" time (in seconds since Unix epoch) */
  nbf?: number;
  /** "Issued At" time (in seconds since Unix epoch) */
  iat?: number;
  /** Unique identifier for the JWT */
  jti?: string;
  /** Allows any additional custom claims (e.g., email, role, permissions) */
  [key: string]: unknown;
}

/**
 * Options for the `useJwt` hook
 */
export interface UseJwtOptions {
  /**
   * Callback triggered when the token expires in real-time.
   */
  onExpire?: () => void;
}

/**
 * Return value of the `useJwt` hook
 */
export interface UseJwtResult<T extends JwtPayload = JwtPayload> {
  /** Decoded payload containing custom and standard claims */
  payload: T | null;
  /** Whether the token has expired based on the current client timestamp */
  isExpired: boolean;
  /** Seconds remaining until token expiration (null if no token or no exp claim) */
  timeUntilExpiry: number | null;
  /** True if the token is non-empty and has a valid 3-part JWT structure */
  isValid: boolean;
  /** True if the token is valid, present, and not expired */
  isAuthenticated: boolean;
}

/**
 * Props for the `<JwtGuard>` component
 */
export interface JwtGuardProps<T extends JwtPayload = JwtPayload> {
  /** The JWT token string to guard against (can be null/undefined during auth load) */
  token?: string | null;
  /** The protected content to render if the token is valid and unexpired */
  children: ReactNode | ((result: UseJwtResult<T>) => ReactNode);
  /** Fallback UI rendered when the token is missing, invalid, or expired */
  fallback?: ReactNode;
  /** Optional callback fired when the token expires while the user is viewing the page */
  onExpire?: () => void;
}
