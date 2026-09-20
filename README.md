# react-jwt-guard 🛡️

[![npm version](https://img.shields.io/npm/v/react-jwt-guard.svg?color=blue)](https://www.npmjs.com/package/react-jwt-guard)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-jwt-guard?color=brightgreen)](https://bundlephobia.com/package/react-jwt-guard)
[![license](https://img.shields.io/npm/l/react-jwt-guard.svg)](https://github.com/)
[![types](https://img.shields.io/badge/types-TypeScript-blue.svg)](https://www.typescriptlang.org/)

A lightweight (< 1KB gzipped), **zero-dependency** React and TypeScript utility for safe JWT decoding, real-time expiration tracking, and declarative component & route guarding in modern web applications.

---

## ⚡ Key Features

* 🪶 **Zero Dependencies**: Pure React & TypeScript primitives. No heavy crypto or polyfill bloat.
* 🔒 **Safe Base64URL Decoding**: Fully compliant with RFC 7519. Handles URL-safe characters (`-`, `_`) and multi-byte Unicode (international text & emojis) without crashing.
* ⏱️ **Real-Time Expiration Watcher**: Automatically detects token expiration the exact second it occurs and triggers `onExpire` callbacks without requiring a manual page refresh.
* 🛡️ **Declarative `<JwtGuard>`**: Drop-in wrapper for route protection with support for standard fallback UI and advanced **Render Props**.
* 🧠 **Strict TypeScript Generics**: Pass your own custom payload interface (`<UserClaims>`) for compile-time type safety and full IDE autocompletion.
* 📦 **Dual Output**: Native support for ESM (`.mjs`) and CommonJS (`.js`).

---

## 📥 Installation

Install via npm, yarn, or pnpm:

```bash
npm install react-jwt-guard
```

```bash
yarn add react-jwt-guard
```

```bash
pnpm add react-jwt-guard
```

> **Note**: `react-jwt-guard` requires `react` and `react-dom` (version `>=16.8.0` including React 18 & React 19) installed as peer dependencies in your project.

---

## 🚀 Quick Start & Usage

### 1. Basic Component / Route Guard (`<JwtGuard>`)

Protect any component or route by rendering a fallback (e.g. `<Navigate to="/login" />` or a message) when the token is missing, malformed, or expired.

```tsx
import React from 'react';
import { JwtGuard } from 'react-jwt-guard';
import { Navigate } from 'react-router-dom';
import { DashboardView } from './DashboardView';

export function ProtectedDashboard({ token }: { token: string | null }) {
  return (
    <JwtGuard
      token={token}
      fallback={<Navigate to="/login" replace />}
      onExpire={() => alert('Session expired! Please log in again.')}
    >
      <DashboardView />
    </JwtGuard>
  );
}
```

---

### 2. Advanced: Render Props Pattern

Eliminate redundant hook calls and prop drilling by accessing the decoded payload and live countdown directly inside JSX:

```tsx
import React from 'react';
import { JwtGuard } from 'react-jwt-guard';

interface UserClaims {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export function AdminArea({ token }: { token: string | null }) {
  return (
    <JwtGuard<UserClaims>
      token={token}
      fallback={<p className="error">Access Denied: Please sign in.</p>}
    >
      {({ payload, timeUntilExpiry }) => (
        <div className="card">
          <h2>Welcome, {payload?.email}!</h2>
          <p>Role: <strong>{payload?.role}</strong></p>
          <small>Session expires in {timeUntilExpiry} seconds</small>
        </div>
      )}
    </JwtGuard>
  );
}
```

---

### 3. Standalone `useJwt` Hook

Use the `useJwt` hook for custom component state, auto-logout workflows, or token refresh flows:

```tsx
import React from 'react';
import { useJwt } from 'react-jwt-guard';

interface AuthClaims {
  sub: string;
  email: string;
  role: string;
}

export function ProfileBadge({ token }: { token: string | null }) {
  const { payload, isAuthenticated, isExpired, timeUntilExpiry } = useJwt<AuthClaims>(token, {
    onExpire: () => {
      console.warn('Token expired at:', new Date().toISOString());
      // Trigger token refresh endpoint or redirect
    }
  });

  if (!isAuthenticated) {
    return <span>Guest User</span>;
  }

  return (
    <div className="badge">
      <span>{payload?.email}</span>
      {isExpired ? (
        <span className="badge-expired">Expired</span>
      ) : (
        <span className="badge-active">Active ({timeUntilExpiry}s remaining)</span>
      )}
    </div>
  );
}
```

---

### 4. Pure Utility: `decodeJwt`

Need to decode a token outside React (e.g., in an Axios interceptor or Node.js service)? Use the standalone utility:

```ts
import { decodeJwt, isTokenExpired } from 'react-jwt-guard';

const token = 'eyJhbGciOi...';

if (!isTokenExpired(token)) {
  const payload = decodeJwt<{ email: string }>(token);
  console.log('User email:', payload?.email);
}
```

---

## 📖 API Reference

### `<JwtGuard<T>>` Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `token` | `string \| null \| undefined` | `undefined` | The raw JWT string to evaluate. |
| `children` | `ReactNode \| ((result: UseJwtResult<T>) => ReactNode)` | **Required** | Content rendered if valid & active. Supports render props. |
| `fallback` | `ReactNode` | `null` | UI displayed if the token is missing, invalid, or expired. |
| `onExpire` | `() => void` | `undefined` | Callback fired the exact moment the token expires in real time. |

---

### `useJwt<T>(token, options)` Return Object (`UseJwtResult<T>`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `payload` | `T \| null` | The parsed JSON payload object (typed with generic `<T>`). |
| `isAuthenticated` | `boolean` | `true` only if token is valid, present, and **not expired**. |
| `isExpired` | `boolean` | `true` if current time `>= exp * 1000` or if no `exp` claim exists. |
| `timeUntilExpiry` | `number \| null` | Seconds remaining until expiration (`null` if no `exp` claim). |
| `isValid` | `boolean` | `true` if token has a valid 3-part compact JWT format and decodable JSON. |

---

### Pure Helper Functions

* `decodeJwt<T>(token: string | null | undefined): T | null`
  * Safely decodes a Base64URL payload into typed JSON. Returns `null` on invalid or malformed tokens.
* `isTokenExpired(token: string | null | undefined): boolean`
  * Returns `false` if unexpired; returns `true` if expired, missing, or invalid.
* `getTokenRemainingSeconds(token: string | null | undefined): number | null`
  * Returns seconds remaining until token expiration, or `0` if expired, or `null` if invalid.

---

## ⚠️ Security Notice

> **Client-Side Decoding vs Backend Verification**:
> Decoding a JWT in the browser allows your UI to read public claims (such as user email or expiration time) to enhance UX. It **does NOT verify the cryptographic signature** (which requires your backend secret key). Always verify all requests on your backend (e.g., via Express middleware with `jwt.verify`).

---

## 📄 License

MIT © 2026
