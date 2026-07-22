# syntax=docker/dockerfile:1.7
# docker build -f backend/Dockerfile -t senvirox-backend .

FROM node:20.18.1-alpine3.20 AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --ignore-scripts

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY backend ./backend
RUN npm run build -w @senvirox/shared \
  && npm run build -w backend \
  && npm prune --omit=dev

FROM node:20.18.1-alpine3.20 AS runner
WORKDIR /app
ENV NODE_ENV=production \
    DATA_DIR=/data

RUN apk add --no-cache dumb-init wget \
  && addgroup -S -g 1001 nodejs \
  && adduser -S -u 1001 -G nodejs expressjs \
  && mkdir -p /data \
  && chown -R expressjs:nodejs /data

COPY --from=builder --chown=expressjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=expressjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=expressjs:nodejs /app/packages/shared ./packages/shared
COPY --from=builder --chown=expressjs:nodejs /app/backend/package.json ./backend/package.json
COPY --from=builder --chown=expressjs:nodejs /app/backend/dist ./backend/dist

USER expressjs
WORKDIR /app/backend
EXPOSE 5000
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/health/live || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
