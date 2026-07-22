# Installation Guide

## Option A — Production host (recommended)

See **[HOSTING.md](./HOSTING.md)** for the full VPS path.

```bash
unzip SENVIROX_Hostable_Product.zip && cd senvirox
node scripts/generate-secrets.mjs app.yourdomain.com
sh scripts/gen-dev-certs.sh app.yourdomain.com   # or real PEMs in deploy/ssl/
./scripts/deploy.sh
```

## Option B — Local Node development

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20.18+ (see `.nvmrc`) |
| npm | 10+ |
| Redis 7 | Optional (refresh tokens use memory in test; Redis in docker) |

```bash
cd senvirox
cp .env.example .env
# For local API, set a JWT_SECRET >= 32 chars without words like "local-foundation"
npm install
npm run verify
npm run dev
```

- Web: http://localhost:3000  
- API: http://localhost:5000  

## Option C — Local Docker (no TLS)

```bash
cp .env.example .env
# set JWT_SECRET
docker compose -f docker-compose.dev.yml up -d --build
```

## First admin user

Open `/register`. The **first** account becomes `super_admin`.

## Production boot rules

When `NODE_ENV=production` the API refuses to start unless:

1. Strong `JWT_SECRET` (≥32, not a known weak pattern)  
2. Non-localhost `CORS_ORIGIN`  
3. `METRICS_TOKEN` ≥ 24 chars  
4. `USER_STORE` is not `memory`  
5. If `USER_STORE=supabase`, Supabase URL + service role are set  

Use `node scripts/generate-secrets.mjs <domain>` to satisfy these automatically.
