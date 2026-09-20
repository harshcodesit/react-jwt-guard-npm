import type { JwtPayload } from './types';

/**
 * Safely decodes a Base64URL encoded string into a UTF-8 string.
 *
 * Why this is needed:
 * 1. Base64URL (RFC 7519) replaces '+' with '-' and '/' with '_', and omits '=' padding.
 * 2. Standard `atob()` breaks on Unicode characters (e.g. accented letters, non-Latin scripts, emojis).
 */
function base64UrlDecode(input: string): string {
  // 1. Convert Base64URL characters back to standard Base64
  let base64 = input.replace(/-/g, '+').replace(/_/g, '/');

  // 2. Add padding '=' back if missing (Base64 strings must be multiples of 4)
  const pad = base64.length % 4;
  if (pad) {
    if (pad === 1) {
      throw new Error('Invalid Base64URL string');
    }
    base64 += new Array(5 - pad).join('=');
  }

  // 3. Decode base64 to binary string
  const binaryString = atob(base64);

  // 4. Safely convert binary string to UTF-8 (handles Unicode / international characters)
  if (typeof TextDecoder !== 'undefined') {
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  // Fallback for older JS runtimes without TextDecoder
  return decodeURIComponent(
    Array.prototype.map
      .call(binaryString, (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
}

/**
 * Decodes the payload portion of a JWT string.
 * Returns `null` if the token is null, undefined, malformed, or has invalid JSON.
 *
 * @param token - Raw JWT string (e.g., "header.payload.signature")
 * @returns Decoded payload object or null
 */
export function decodeJwt<T extends JwtPayload = JwtPayload>(token: string | null | undefined): T | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const parts = token.trim().split('.');
  // A valid compact JWT MUST have exactly 3 parts: Header, Payload, Signature
  if (parts.length !== 3) {
    return null;
  }

  try {
    const decodedJson = base64UrlDecode(parts[1]);
    return JSON.parse(decodedJson) as T;
  } catch {
    return null;
  }
}

/**
 * Checks whether a given JWT token has expired.
 *
 * @param token - Raw JWT string
 * @returns boolean - true if expired or invalid; false if still valid
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') {
    return true; // No exp claim or invalid token is treated as expired
  }

  // exp is in seconds; Date.now() is in milliseconds
  return Date.now() >= payload.exp * 1000;
}

/**
 * Returns remaining seconds until token expiration.
 * Returns `0` if expired, or `null` if the token is invalid/has no `exp` claim.
 */
export function getTokenRemainingSeconds(token: string | null | undefined): number | null {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') {
    return null;
  }

  const remainingMs = payload.exp * 1000 - Date.now();
  return remainingMs > 0 ? Math.floor(remainingMs / 1000) : 0;
}
