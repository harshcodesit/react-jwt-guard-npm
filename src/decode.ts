import type { JwtPayload } from './types';

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Restore stripped base64 padding
  const pad = base64.length % 4;
  if (pad) {
    if (pad === 1) throw new Error('Invalid base64url string');
    base64 += '='.repeat(4 - pad);
  }

  const binary = atob(base64);

  if (typeof TextDecoder !== 'undefined') {
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  return decodeURIComponent(
    Array.prototype.map
      .call(binary, (char: string) => `%${('00' + char.charCodeAt(0).toString(16)).slice(-2)}`)
      .join('')
  );
}

export function decodeJwt<T extends JwtPayload = JwtPayload>(token: string | null | undefined): T | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;

  try {
    const raw = base64UrlDecode(parts[1]);
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string | null | undefined): boolean {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') return true;

  return Date.now() >= payload.exp * 1000;
}

export function getTokenRemainingSeconds(token: string | null | undefined): number | null {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') return null;

  const diff = payload.exp * 1000 - Date.now();
  return diff > 0 ? Math.floor(diff / 1000) : 0;
}
