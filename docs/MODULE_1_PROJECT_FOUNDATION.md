# Module 1 — Project Foundation

| Field           | Value                                                           |
| --------------- | --------------------------------------------------------------- |
| Product         | SENVIROX Enterprise Digital Signage SaaS                        |
| Module          | Project Foundation                                              |
| Status          | **Complete · production-verified**                              |
| Stack           | Next.js 15 · React 19 · Express · TypeScript · Redis · Supabase |
| Architecture    | Clean Architecture + DDD-lite (API) · App Router (console)      |
| Package manager | npm workspaces                                                  |

---

## 1. Architecture

### 1.1 System context

```
┌────────────────────┐     HTTPS/JSON      ┌─────────────────────┐
│  Next.js Console   │ ──────────────────► │  Express API        │
│  (frontend :3000)  │                     │  (backend :5000)    │
└────────────────────┘                     └──────────┬──────────┘
                                                      │
                         ┌────────────────────────────┼────────────────────────────┐
                         ▼                            ▼                            ▼
                  ┌─────────────┐              ┌─────────────┐              ┌─────────────┐
                  │    Redis    │              │  Supabase   │              │  Metrics    │
                  │   cache     │              │  PG/Auth    │              │ /metrics    │
                  └─────────────┘              └─────────────┘              └─────────────┘
```

### 1.2 Backend layering (Clean Architecture)

```
interfaces/http     Controllers, routes, middleware (delivery)
        │
application         Use cases (HealthService), ports (ICachePort, ITokenService, …)
        │
domain              Entities (User), errors (AppError), repository interfaces
        │
infrastructure      Redis, Supabase, JWT (jose), structured logger
        │
config / container  Zod env, app config, composition root (DI)
```

**SOLID application**

| Principle | How                                                                     |
| --------- | ----------------------------------------------------------------------- |
| S         | One service/controller per concern (`HealthService`, `JwtTokenService`) |
| O         | New features add ports/adapters without changing domain                 |
| L         | `InMemoryCache` / `RedisCache` both satisfy `ICachePort`                |
| I         | Narrow ports (`ICachePort`, `IDatabasePort`, `ITokenService`)           |
| D         | HTTP + services depend on ports; `container.ts` wires implementations   |

### 1.3 Frontend structure

- **App Router** routes: `/`, `/health`, `not-found`
- **lib/**: env (Zod), typed API client, Supabase browser/server clients
- **components/ui**: shadcn-style Button, Card, Badge
- **hooks**: `useApiHealth` for live dependency status

### 1.4 Shared kernel

`@senvirox/shared` owns cross-cutting contracts:

- API success/failure envelope
- Health DTO + status constants
- RBAC roles + `hasMinimumRole`
- Device status constants (for later modules)

Built to `dist/` (ESM + `.d.ts`) on `postinstall`.

---

## 2. Folder tree

```
senvirox/
├── package.json                 # workspaces root
├── package-lock.json
├── tsconfig.base.json
├── docker-compose.yml
├── .env.example
├── .dockerignore
├── .editorconfig
├── .prettierrc.json
├── .gitignore
├── .nvmrc
├── LICENSE
├── README.md
├── docs/MODULE_1_PROJECT_FOUNDATION.md
├── .github/workflows/foundation-ci.yml
├── scripts/
│   ├── prepare-env.mjs
│   └── verify-foundation.mjs
├── packages/shared/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── constants.ts
│       ├── roles.ts
│       └── types.ts
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.cjs
│   ├── .eslintrc.cjs
│   ├── src/
│   │   ├── server.ts
│   │   ├── app.ts
│   │   ├── container.ts
│   │   ├── config/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── interfaces/http/
│   │   └── shared/
│   └── tests/
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── components.json
    └── src/
        ├── app/
        ├── components/
        ├── hooks/
        ├── lib/
        └── types/
```

---

## 3. Source code map

| Path                                                 | Responsibility                    |
| ---------------------------------------------------- | --------------------------------- |
| `backend/src/config/env.ts`                          | Zod env parse + production guards |
| `backend/src/container.ts`                           | Composition root / DI             |
| `backend/src/app.ts`                                 | Express middleware stack          |
| `backend/src/server.ts`                              | HTTP listen + graceful shutdown   |
| `backend/src/application/services/HealthService.ts`  | Aggregate dependency health       |
| `backend/src/infrastructure/cache/RedisCache.ts`     | Redis + in-memory adapters        |
| `backend/src/infrastructure/http/JwtTokenService.ts` | Access token sign/verify          |
| `backend/src/interfaces/http/middleware/*`           | Auth, errors, metrics, request-id |
| `frontend/src/lib/api-client.ts`                     | Typed fetch client                |
| `frontend/src/components/health-status-card.tsx`     | Live health UI                    |
| `packages/shared/src/*`                              | Shared contracts                  |

---

## 4. Configuration

### Environment (`.env.example`)

| Variable                        | Used by  | Notes                                 |
| ------------------------------- | -------- | ------------------------------------- |
| `NEXT_PUBLIC_API_URL`           | Frontend | Public API base                       |
| `NEXT_PUBLIC_SUPABASE_*`        | Frontend | Browser Supabase                      |
| `PORT` / `HOST` / `API_PREFIX`  | Backend  | Listen + routing                      |
| `CORS_ORIGIN`                   | Backend  | Comma-separated origins               |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Backend  | ≥32 chars in production               |
| `REDIS_URL`                     | Backend  | Cache / future rate-limit store       |
| `SUPABASE_*`                    | Backend  | Service role never exposed to browser |
| `RATE_LIMIT_*`                  | Backend  | express-rate-limit                    |

Production boot **fails** if JWT is weak, CORS is localhost, or Supabase service credentials are missing.

### Tooling

- TypeScript strict (`tsconfig.base.json`)
- ESLint (backend + `next lint`)
- Prettier
- EditorConfig
- Node pin via `.nvmrc` → `20.18.1`

---

## 5. Docker

```bash
# From monorepo root
docker compose up -d --build
```

| Service    | Image build                                            | Port |
| ---------- | ------------------------------------------------------ | ---- |
| `redis`    | `redis:7.4-alpine`                                     | 6379 |
| `backend`  | `backend/Dockerfile`                                   | 5000 |
| `frontend` | `frontend/Dockerfile` (build-args for `NEXT_PUBLIC_*`) | 3000 |

Images: multi-stage, non-root users, `dumb-init`, healthchecks, Alpine Node 20.18.1.

---

## 6. Testing

```bash
npm test
# backend: 15 tests (health, system, auth middleware, domain)
# frontend: 3 tests (env, cn utility)
```

| Suite                     | Coverage focus                                    |
| ------------------------- | ------------------------------------------------- |
| `health.test.ts`          | `/health`, versioned health, live/ready           |
| `system.test.ts`          | `/api/v1/system/info`, `/metrics`, 404 envelope   |
| `auth.middleware.test.ts` | Bearer required, JWT accept, RBAC deny            |
| `domain.test.ts`          | User entity, AppError, role ranks, health service |
| frontend unit             | `cn()`, public env helpers                        |

CI: `.github/workflows/foundation-ci.yml` → install → typecheck → test → build.

---

## 7. HTTP API (foundation)

| Method | Path                  | Description           |
| ------ | --------------------- | --------------------- |
| GET    | `/health`             | Aggregate health JSON |
| GET    | `/health/live`        | Liveness              |
| GET    | `/health/ready`       | Readiness             |
| GET    | `/metrics`            | Prometheus text       |
| GET    | `/api/v1/health`      | Versioned health      |
| GET    | `/api/v1/system/info` | Platform metadata     |

Response envelope (`@senvirox/shared`):

```json
{
  "success": true,
  "data": {},
  "meta": { "requestId": "…", "timestamp": "…" }
}
```

---

## 8. Commands

```bash
cp .env.example .env
npm install
npm run dev
npm run typecheck && npm run lint && npm test && npm run build
npm run verify
```

---

## 9. Verification record

| Gate                  | Result |
| --------------------- | ------ |
| typecheck             | Pass   |
| lint                  | Pass   |
| format                | Pass   |
| test                  | 18/18  |
| build                 | Pass   |
| API smoke             | Pass   |
| TODO/placeholder scan | Clean  |

---

## 10. Explicit non-goals (Module 1)

- Full authentication product (login UI, refresh rotation, 2FA)
- Device registry / heartbeat product API
- Media, playlists, scheduling
- Android TV player
- Kubernetes manifests (available from prior DevOps audit separately)

**Next module (requires approval):** Auth & RBAC.
