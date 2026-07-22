# Development Guide — Module 1

## Workspace layout

| Path              | Package            | Role                              |
| ----------------- | ------------------ | --------------------------------- |
| `packages/shared` | `@senvirox/shared` | Shared types, roles, API envelope |
| `backend`         | `backend`          | Express Clean Architecture API    |
| `frontend`        | `frontend`         | Next.js 15 console shell          |

## Everyday commands

```bash
npm run dev:backend      # tsx watch :5000
npm run dev:frontend     # next dev :3000
npm run typecheck
npm run lint
npm run format
npm test
npm run test:backend
npm run test:frontend
npm run build
npm run audit:prod
```

## Adding code (conventions)

### Backend

1. Domain types/errors under `backend/src/domain`
2. Ports under `backend/src/application/ports`
3. Use cases under `backend/src/application/services`
4. Adapters under `backend/src/infrastructure`
5. HTTP under `backend/src/interfaces/http`
6. Wire in `backend/src/container.ts` then routes

Do **not** import infrastructure from domain.

### Frontend

1. Routes in `frontend/src/app`
2. UI primitives in `frontend/src/components/ui`
3. Data access via `frontend/src/lib/api-client.ts`
4. Public env only through `frontend/src/lib/env.ts`

### Shared

Export only stable contracts from `packages/shared/src/index.ts`.  
Run `npm run build -w @senvirox/shared` after changes (also runs on postinstall).

## Testing

Backend tests use Jest + Supertest with `NODE_ENV=test` and in-memory cache.

```bash
npm run test:backend -- --coverage
```

## API surfaces (foundation)

| Method | Path                                       |
| ------ | ------------------------------------------ |
| GET    | `/health`                                  |
| GET    | `/health/live`                             |
| GET    | `/health/ready`                            |
| GET    | `/metrics` (Bearer if `METRICS_TOKEN` set) |
| GET    | `/api/v1/health`                           |
| GET    | `/api/v1/system/info`                      |

## Out of scope for Module 1

Login UI, refresh tokens, devices, playlists, Android player, Kubernetes.
