# VaultMind Auth

### 1. Refresh tokens
- **Access token**: 15 min, signed JWT (`HS256`), minimal payload
  (`sub`, `role`, `jti`, `iss`, `aud` — no email/PII).
- **Refresh token**: 30 days, opaque random token, sent as an
  **httpOnly, `SameSite=Strict` cookie** scoped to `/auth`. Only its
  SHA-256 hash is stored in Postgres — a DB leak doesn't hand out
  usable tokens.
- **Rotation**: every `/auth/refresh` call revokes the old refresh
  token and issues a new one. If a stolen token gets replayed after
  the legitimate client already rotated it, the old token is already
  revoked — a clear theft signal you can alert on.
- **Logout**: `/auth/logout` revokes the current refresh token and
  clears the cookie. Token-service also exposes
  `revokeAllRefreshTokens(userId)` for a future "log out everywhere" /
  forced password-change flow.

### 2. Shared `@vaultmind/auth-shared` package
Lives at `packages/auth-shared`. Any service that needs to authenticate
requests imports from here instead of re-implementing JWT verification:

```ts
import { createAuthMiddleware, authorize, type AuthVariables } from "@vaultmind/auth-shared";

const authenticate = createAuthMiddleware(process.env.JWT_SECRET!, "vaultmind.services");

app.get("/something", authenticate, authorize("ADMIN"), handler);
```

`createAuthMiddleware` takes the shared secret and the expected `aud`
claim, so a token minted for one audience can't be replayed against a
service expecting a different one. `authorize(...roles)` must run after
`authenticate` and checks `c.get("user").role`.

See `services/example-service/src/routes/vault.routes.ts` for a worked
example of a *different* service consuming this.

### 3. Password hashing
Pinned to **argon2id** explicitly (`memoryCost: 19456`, `timeCost: 2` —
OWASP minimums) instead of relying on whatever Bun's default happens to
be. A future Bun upgrade changing its default won't silently change
your security posture.

### 4. Password policy
Registration now requires 12+ characters with upper/lower/digit mix
(was: 8 chars, nothing else). Login intentionally does **not** enforce
this — it only needs to match whatever hash exists, so legacy/looser
passwords from before a policy tightening still log in fine.

### 5. Login timing-safety
`login()` now always runs a password verify, even for a non-existent
email (against a real argon2id hash of a dummy string), so the
response time doesn't leak whether an email exists in the system.

### 6. Rate limiting
`/auth/register`, `/auth/login`, and `/auth/refresh` are rate-limited
per-IP using a Redis-backed fixed window (atomic `INCR` + `EXPIRE` via a
Lua script). This is shared across every auth-service instance, so
scaling horizontally no longer multiplies the effective limit by
instance count. On a Redis connection error, the limiter fails open
(requests are allowed through) rather than blocking auth entirely —
this is logged so it's visible in monitoring even though it doesn't
block the request. Requires `REDIS_URL` to be set.

### 7. Bearer token parsing
Hardened against malformed/wrong-scheme headers (`Basic ...`, lowercase
`bearer`, double-spaced headers) — previously a naive `.replace("Bearer ", "")`
would silently "succeed" on non-Bearer schemes.

### 8. Error handling
`app.onError` now distinguishes expected `AppError`s (bad credentials,
conflicts — not logged, just returned) from unexpected errors (logged
loudly via `console.error`, never leaked to the client as raw messages).

### 9. Fixed: RabbitMQ never connected
The original `server.ts` never called `connectRabbit()` — the very
first `publishEvent()` call would have thrown on an undefined channel.
Fixed, plus `getChannel()` now throws a clear error instead of
returning `undefined` if called before connection.

## Setup

```bash
npm install        # from repo root, installs all workspaces
cd services/auth-service
npx prisma generate
npx prisma migrate dev
```

Required env vars (auth-service):
```
DATABASE_URL=postgresql://...
JWT_SECRET=<same value across every service that verifies tokens>
RABBITMQ_URL=amqp://...
NODE_ENV=production   # enables `secure` cookie flag
PORT=3001
```

Every other service that calls `createAuthMiddleware` needs the same
`JWT_SECRET` value available in its environment.

## Endpoints

| Method | Path             | Auth required  | Notes                                    |
|--------|------------------|----------------|------------------------------------------|
| POST   | `/auth/register` | No             | Rate-limited 5/min/IP                    |
| POST   | `/auth/login`    | No             | Rate-limited 10/min/IP                   |
| POST   | `/auth/refresh`  | Refresh cookie | Rate-limited 20/min/IP, rotates token    |
| POST   | `/auth/logout`   | Refresh cookie | Revokes refresh token, clears cookie     |
