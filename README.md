# react-jwt-guard

[![npm version](https://img.shields.io/npm/v/react-jwt-guard.svg?color=blue)](https://www.npmjs.com/package/react-jwt-guard)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-jwt-guard?color=brightgreen)](https://bundlephobia.com/package/react-jwt-guard)
[![license](https://img.shields.io/npm/l/react-jwt-guard.svg)](https://github.com/)
[![types](https://img.shields.io/badge/types-TypeScript-blue.svg)](https://www.typescriptlang.org/)

A lightweight (< 1KB gzipped), zero-dependency React and TypeScript utility for safe JWT decoding, real-time expiration monitoring, and declarative component protection.

---

## Features

- **Zero Dependencies**: Built entirely with native JavaScript and React primitives.
- **Safe Base64URL Decoding**: Fully compliant with RFC 7519. Safely normalizes URL-safe characters (`-`, `_`) and handles multi-byte UTF-8 Unicode without throwing runtime errors.
- **Real-Time Expiration Watcher**: Automatically calculates remaining token lifetime and triggers `onExpire` callbacks the exact second a token lapses.
- **Declarative Guard Component**: Drop-in `<JwtGuard>` boundary supporting both standard fallback UI and render props.
- **TypeScript First**: Full generic support (`<T>`) for custom claims, offering autocomplete and static type safety.
- **Dual Bundle**: Includes ESM (`.mjs`) and CommonJS (`.js`) outputs with auto-generated type declarations (`.d.ts`).

---

## Installation

```bash
npm install react-jwt-guard
```

```bash
yarn add react-jwt-guard
```

```bash
pnpm add react-jwt-guard
```

### Peer Dependencies

Ensure `react` and `react-dom` (version `>=16.8.0`) are installed in your project:

```json
"peerDependencies": {
  "react": ">=16.8.0 || >=17.0.0 || >=18.0.0 || >=19.0.0",
  "react-dom": ">=16.8.0 || >=17.0.0 || >=18.0.0 || >=19.0.0"
}
```

---

## Quick Start

### 1. Route / Component Protection (`<JwtGuard>`)

Render protected sections when authenticated, or show a fallback (redirect or error message) when the token is missing, malformed, or expired.

```tsx
import React from 'react';
import { JwtGuard } from 'react-jwt-guard';
import { Navigate } from 'react-router-dom';
import { Dashboard } from './Dashboard';

export function ProtectedRoute({ token }: { token: string | null }) {
  return (
    <JwtGuard
      token={token}
      fallback={<Navigate to="/login" replace />}
      onExpire={() => alert('Session expired. Please log in again.')}
    >
      <Dashboard />
    </JwtGuard>
  );
}
```

---

### 2. Accessing Claims via Render Props

Pass custom interfaces to `<JwtGuard>` to read user claims and expiration data directly inside JSX without invoking hooks separately:

```tsx
import React from 'react';
import { JwtGuard } from 'react-jwt-guard';

interface UserPayload {
  sub: string;
  email: string;
  role: 'admin' | 'user';
}

export function AccountSection({ token }: { token: string | null }) {
  return (
    <JwtGuard<UserPayload>
      token={token}
      fallback={<p>Please sign in to view account details.</p>}
    >
      {({ payload, timeUntilExpiry }) => (
        <div>
          <h2>User: {payload?.email}</h2>
          <p>Role: {payload?.role}</p>
          <p>Expires in: {timeUntilExpiry}s</p>
        </div>
      )}
    </JwtGuard>
  );
}
```

---

### 3. Custom Hook Usage (`useJwt`)

For custom state management, auto-logout hooks, or authentication headers:

```tsx
import React from 'react';
import { useJwt } from 'react-jwt-guard';

interface AuthClaims {
  id: string;
  email: string;
}

export function UserBadge({ token }: { token: string | null }) {
  const { payload, isAuthenticated, isExpired, timeUntilExpiry } = useJwt<AuthClaims>(token, {
    onExpire: () => {
      console.warn('Session expired. Initiating refresh token request...');
    }
  });

  if (!isAuthenticated) {
    return <span>Not authenticated</span>;
  }

  return (
    <div>
      <span>Signed in as {payload?.email}</span>
      {isExpired ? (
        <span>(Expired)</span>
      ) : (
        <span>({timeUntilExpiry}s remaining)</span>
      )}
    </div>
  );
}
```

---

### 4. Standalone Utilities

Use `decodeJwt`, `isTokenExpired`, and `getTokenRemainingSeconds` in non-React environments (e.g., Axios interceptors, middleware):

```ts
import { decodeJwt, isTokenExpired, getTokenRemainingSeconds } from 'react-jwt-guard';

const token = 'eyJhbGciOi...';

if (!isTokenExpired(token)) {
  const user = decodeJwt<{ email: string }>(token);
  const secondsLeft = getTokenRemainingSeconds(token);
  console.log(`User: ${user?.email}, Time left: ${secondsLeft}s`);
}
```

---

## API Reference

### `<JwtGuard<T>>` Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `token` | `string \| null \| undefined` | `undefined` | Raw JWT string to validate. |
| `children` | `ReactNode \| ((result: UseJwtResult<T>) => ReactNode)` | Required | Rendered when token is valid and unexpired. |
| `fallback` | `ReactNode` | `null` | Rendered when token is missing, invalid, or expired. |
| `onExpire` | `() => void` | `undefined` | Callback invoked when the token expires in real time. |

---

### `useJwt<T>(token, options)`

#### Parameters

- `token` (`string | null | undefined`): Raw JWT string.
- `options` (`UseJwtOptions`):
  - `onExpire` (`() => void`): Callback executed when token expires.

#### Return Value (`UseJwtResult<T>`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `payload` | `T \| null` | Decoded claims object typed with `<T>`. |
| `isAuthenticated` | `boolean` | `true` if token is valid, non-empty, and unexpired. |
| `isExpired` | `boolean` | `true` if current time exceeds token `exp` or `exp` is absent. |
| `timeUntilExpiry` | `number \| null` | Remaining seconds until expiration (`null` if no `exp`). |
| `isValid` | `boolean` | `true` if token conforms to standard 3-part JWT structure. |

---

### Utility Functions

- **`decodeJwt<T>(token: string | null | undefined): T | null`**
  Decodes Base64URL payload into a typed JSON object without verifying cryptographic signature. Returns `null` if invalid.
- **`isTokenExpired(token: string | null | undefined): boolean`**
  Checks whether `exp * 1000` is in the past.
- **`getTokenRemainingSeconds(token: string | null | undefined): number | null`**
  Returns seconds remaining until expiration. Returns `0` if expired, or `null` if invalid.

---

## Security Consideration

Client-side JWT decoding is intended exclusively for UI state management (such as displaying user metadata or scheduling re-authentication). It does not verify the cryptographic signature of the token. All authorization decisions and sensitive operations must be verified on the backend using the corresponding secret or public key.

---

## License

MIT © 2026
