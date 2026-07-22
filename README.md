# SENVIROX — Hostable Product (Modules 1–2)

Enterprise digital signage **control plane** you can deploy today.

| Layer | Stack |
|-------|--------|
| Edge | Nginx TLS reverse proxy |
| Console | Next.js 15 · React 19 · TypeScript |
| API | Express · Clean Architecture · JWT Auth/RBAC |
| Data | Redis sessions · File or Supabase users |

**Status:** Production-hostable for Foundation + Auth  
**Package goal:** extract → secrets → TLS → `./scripts/deploy.sh`

---

## Quick deploy (VPS)

```bash
unzip SENVIROX_Hostable_Product.zip && cd senvirox
node scripts/generate-secrets.mjs app.yourdomain.com
sh scripts/gen-dev-certs.sh app.yourdomain.com   # or install real PEMs
chmod +x scripts/*.sh
./scripts/deploy.sh
```

Then open:

- Console: `https://app.yourdomain.com`
- Register first admin: `/register`
- API health: `/health`

Full runbook: **[docs/HOSTING.md](docs/HOSTING.md)**

---

## Local development

```bash
cp .env.example .env
# set JWT_SECRET to any >=32 char non-placeholder string for local API
npm install
npm run dev
# Web :3000 · API :5000
```

Or:

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

---

## Included modules

| # | Module | Docs |
|---|--------|------|
| 1 | Project Foundation | [docs/MODULE_1_PROJECT_FOUNDATION.md](docs/MODULE_1_PROJECT_FOUNDATION.md) |
| 2 | Auth & RBAC | [docs/MODULE_2_AUTH_RBAC.md](docs/MODULE_2_AUTH_RBAC.md) |

### Auth API

`POST /api/v1/auth/register|login|refresh|logout`  
`GET /api/v1/auth/me` · `POST /change-password` · `GET /admin-probe` (RBAC)

First registered user → `super_admin`.

---

## Quality gates

```bash
npm run verify   # format, lint, typecheck, test, build
npm test
npm run build
```

---

## Hosting layout

```
deploy/nginx/          TLS edge config + image
deploy/ssl/            fullchain.pem + privkey.pem (you provide)
database/              Supabase SQL (optional)
scripts/deploy.sh      one-shot production launch
scripts/generate-secrets.mjs
docker-compose.yml     production stack
docker-compose.dev.yml local stack without TLS
```

---

## Not in this release

Devices/heartbeat fleet · media/playlists · Android TV player · multi-tenant org admin UI

---

## License

MIT © SENVIROX — see [LICENSE](LICENSE)
