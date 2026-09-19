# react-jwt-guard 🛡️

A lightweight (~800 bytes gzipped), zero-dependency React & TypeScript utility for decoding JSON Web Tokens (JWTs), monitoring expiration in real time, and declaratively guarding components and routes in MERN applications.

---

## 💡 What Problem Does This Solve?

In almost every MERN (MongoDB, Express, React, Node.js) application:
1. The backend issues a JWT containing user details (`id`, `email`, `role`, `exp`).
2. The React frontend stores this token (in memory, `localStorage`, or cookie).
3. **The Common Issues**:
   * Developers manually call `atob(token.split('.')[1])`, which throws runtime errors on base64url characters (`-`, `_`) or multi-byte Unicode strings.
   * Apps don't know a token has expired until an API call fails with a `401 Unauthorized`.
   * Developers reinvent route guards and timers across multiple components.
   * Installing bloated libraries just to decode a payload is unnecessary overhead.

**`react-jwt-guard`** provides a type-safe, zero-dependency solution with:
* Safe base64url decoding (handles UTF-8 and URL-safe characters).
* Real-time expiration tracking with an auto-expiring timer and callback.
* A clean `<JwtGuard>` wrapper for components and routes.

---

## 📦 Features

* **Zero Dependencies**: Pure TypeScript and React primitives (`useState`, `useEffect`, `useMemo`).
* **Safe Base64URL Decoding**: Fully compliant with RFC 7519 (no crashes on `-` or `_`).
* **Strictly Typed Generics**: Pass your custom token payload type (e.g., `{ role: 'admin' | 'user' }`).
* **Live Expiration Watcher**: Triggers an `onExpire` event as soon as the token runs out—no refresh button required.
* **Component & Route Guard**: Drop-in `<JwtGuard>` component to render private UI or fallbacks.

---

## 🚀 Quickstart & Usage

### 1. The `useJwt` Hook (State & Expiration)

```tsx
import React from 'react';
import { useJwt } from 'react-jwt-guard';

interface UserClaims {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export function UserProfile({ token }: { token: string | null }) {
  const { payload, isExpired, timeUntilExpiry, isValid } = useJwt<UserClaims>(token, {
    onExpire: () => {
      alert('Your session has expired! Please log in again.');
      // e.g. navigate('/login') or trigger refresh token endpoint
    }
  });

  if (!isValid) return <p>No valid token provided.</p>;
  if (isExpired) return <p>Session expired. Please log in.</p>;

  return (
    <div>
      <h3>Welcome, {payload?.email}!</h3>
      <p>Role: {payload?.role}</p>
      <p>Token expires in: {timeUntilExpiry}s</p>
    </div>
  );
}
```

---

### 2. The `<JwtGuard>` Component (Protecting Routes / Sections)

```tsx
import React from 'react';
import { JwtGuard } from 'react-jwt-guard';

export function Dashboard({ token }: { token: string | null }) {
  return (
    <JwtGuard
      token={token}
      fallback={<p>Access Denied: Please log in to view the dashboard.</p>}
      onExpire={() => console.log('Session expired while viewing dashboard')}
    >
      <AdminPanel />
    </JwtGuard>
  );
}
```

---

### 3. Pure Utility: `decodeJwt`

If you just need to decode a token outside of React (e.g., in an Axios interceptor or pure TypeScript file):

```ts
import { decodeJwt } from 'react-jwt-guard';

const payload = decodeJwt<{ email: string }>(token);
console.log(payload?.email);
```

---

## 🧠 Technical Concepts for Interviews

When interviewers ask you about this package, here are the exact architectural decisions and technical talking points to highlight:

### 1. Base64 vs Base64URL Encoding
* Standard Base64 uses `+` and `/`, which have special meaning in URLs.
* JWTs (RFC 7519) use **Base64URL**, replacing `+` with `-` and `/` with `_`, and removing `=` padding.
* Our `decodeJwt` properly sanitizes these characters before decoding and safely handles UTF-8 characters via `decodeURIComponent(escape(atob(...)))` or `TextDecoder`.

### 2. Client-Side Decoding vs Backend Signature Verification
* **Crucial distinction**: Frontend decoding is **purely for UI state** (e.g., displaying user email, hiding/showing buttons, knowing when to redirect).
* It **does not verify the cryptographic signature** (which requires the backend secret key). The backend must still verify all incoming JWTs via `jwt.verify(token, process.env.JWT_SECRET)`.

### 3. Timer & React Memory Leak Management
* In `useJwt`, when a token is active, we compute `(exp * 1000) - Date.now()`.
* If it expires in the future, we set a `setTimeout` to flip `isExpired` and trigger `onExpire`.
* **Important**: We clear the timeout in the `useEffect` cleanup function to prevent memory leaks and unmounted component updates.

### 4. TypeScript Generics
* `decodeJwt<T>` and `useJwt<T>` accept a generic `T` extending `JwtPayload`. This provides full auto-completion and compile-time type safety for custom claims (like `role`, `orgId`, `permissions`).

---

## 🛠️ Project Roadmap

1. [x] Architectural & API Design (`README.md`)
2. [ ] Core Library Code (`src/decode.ts`, `src/useJwt.ts`, `src/JwtGuard.tsx`, `src/index.ts`)
3. [ ] Bundler Configuration with `tsup` (generating ESM, CJS, and `.d.ts`)
4. [ ] Local Playground Test (testing inside React app / Vite sandbox)
5. [ ] Package Configuration (`package.json`, `.npmignore`, license)
6. [ ] Publishing to npm registry
