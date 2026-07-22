# Module 2 — Auth & RBAC

| Field      | Value                                      |
| ---------- | ------------------------------------------ |
| Module     | Authentication & Role-Based Access Control |
| Status     | Complete                                   |
| Depends on | Module 1 — Project Foundation              |

---

## Capabilities

| Capability      | Implementation                                                  |
| --------------- | --------------------------------------------------------------- |
| Register        | `POST /api/v1/auth/register` — first user becomes `super_admin` |
| Login           | `POST /api/v1/auth/login` — scrypt password verify              |
| Access JWT      | HS256, short-lived (`JWT_EXPIRES_IN`, default 15m)              |
| Refresh JWT     | Rotating refresh tokens, server-side revoke list                |
| Logout          | Revoke one refresh token                                        |
| Logout all      | Revoke all sessions for user                                    |
| Me              | `GET /api/v1/auth/me`                                           |
| Change password | Re-hash + revoke all refresh sessions                           |
| RBAC            | `requireRole(minimum)` middleware + role ranks                  |
| Console UI      | `/login`, `/register`, `/account`                               |

---

## Architecture

```
AuthController
    → AuthService (application)
        → IUserRepository
        → IPasswordHasher (scrypt)
        → ITokenService (jose access + refresh)
        → IRefreshTokenStore (memory / Redis)
```

### Roles (shared)

`super_admin` > `admin` > `manager` > `operator` > `viewer`

---

## API

| Method | Path                           | Auth                  |
| ------ | ------------------------------ | --------------------- |
| POST   | `/api/v1/auth/register`        | Public                |
| POST   | `/api/v1/auth/login`           | Public                |
| POST   | `/api/v1/auth/refresh`         | Public (refresh body) |
| POST   | `/api/v1/auth/logout`          | Public (refresh body) |
| GET    | `/api/v1/auth/me`              | Bearer access         |
| POST   | `/api/v1/auth/logout-all`      | Bearer access         |
| POST   | `/api/v1/auth/change-password` | Bearer access         |
| GET    | `/api/v1/auth/admin-probe`     | Bearer + min `admin`  |

Password policy: ≥10 chars, at least one letter and one number.

---

## Security notes

- Passwords stored as `scrypt$N$r$p$salt$hash` (Node crypto, no native addon).
- Refresh tokens hashed (SHA-256) at rest in the token store.
- Refresh rotation: old token revoked on successful refresh.
- Auth routes have a dedicated rate limiter (`AUTH_RATE_LIMIT_MAX`).
- Production still requires strong `JWT_SECRET`, Supabase, CORS, `METRICS_TOKEN`.

### Persistence

- Default user store: **in-memory** (process local) — suitable for foundation/dev/test and single-node demos.
- Refresh store: **in-memory** in test; **Redis** when not using memory cache in runtime container.
- Swap `IUserRepository` for Supabase/Postgres adapter in a later data module without changing `AuthService`.

---

## Frontend

| Route       | Purpose                  |
| ----------- | ------------------------ |
| `/login`    | Sign-in form             |
| `/register` | Registration form        |
| `/account`  | Session profile + logout |

Tokens stored in `localStorage` keys:

- `senvirox.accessToken`
- `senvirox.refreshToken`
- `senvirox.user`

---

## Tests

Backend `auth.service.test.ts` covers register/login/refresh rotation/RBAC/password change/scrypt.

---

## Explicit non-goals

- Email verification / magic links
- OAuth social login
- 2FA/TOTP
- Multi-tenant org admin UI (Module 3)
- Password reset email flow
