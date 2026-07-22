import { resolve } from 'node:path';
import { APP_NAME, API_VERSION } from '@senvirox/shared';
import { env } from './env.js';

function parseDurationToMs(value: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value.trim());
  if (!match) {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber) && asNumber > 0) {
      return asNumber * 1000;
    }
    return 7 * 24 * 60 * 60 * 1000;
  }
  const amount = Number(match[1]);
  const unit = match[2];
  switch (unit) {
    case 'ms':
      return amount;
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'd':
      return amount * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

export const appConfig = {
  name: APP_NAME,
  version: process.env.npm_package_version ?? '1.0.0',
  apiVersion: API_VERSION,
  env: env.NODE_ENV,
  host: env.HOST,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  corsOrigin: env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  userStore: env.USER_STORE,
  dataDir: resolve(env.DATA_DIR),
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    refreshTtlMs: parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN),
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    deviceMax: env.DEVICE_RATE_LIMIT_MAX,
    authMax: env.AUTH_RATE_LIMIT_MAX,
  },
  redis: {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
    keyPrefix: env.REDIS_KEY_PREFIX,
  },
  supabase: {
    url: env.SUPABASE_URL ?? '',
    anonKey: env.SUPABASE_ANON_KEY ?? '',
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  },
  metricsToken: env.METRICS_TOKEN,
} as const;

export type AppConfig = typeof appConfig;
