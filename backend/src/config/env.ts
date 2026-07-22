import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const candidates = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../.env'),
  resolve(process.cwd(), '../../.env'),
];

for (const path of candidates) {
  if (existsSync(path)) {
    loadDotenv({ path });
    break;
  }
}

const emptyToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  HOST: z.string().default('0.0.0.0'),
  API_PREFIX: z.string().default('/api/v1'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:3000'),

  /**
   * User persistence:
   * - auto: supabase if configured, else file (prod/dev), memory (test)
   * - file: durable JSON under DATA_DIR
   * - supabase: Postgres via service role
   * - memory: process-local (tests / ephemeral)
   */
  USER_STORE: z.enum(['auto', 'file', 'supabase', 'memory']).default('auto'),
  DATA_DIR: z.string().default('./data'),

  SUPABASE_URL: optionalUrl,
  SUPABASE_ANON_KEY: optionalString.default(undefined),
  SUPABASE_SERVICE_ROLE_KEY: optionalString.default(undefined),

  JWT_SECRET: z.string().min(32).default('local-foundation-jwt-secret-32b-min-value'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_ISSUER: z.string().default('senvirox'),
  JWT_AUDIENCE: z.string().default('senvirox-api'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(200),
  DEVICE_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(600),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),

  REDIS_URL: z.string().default('redis://127.0.0.1:6379/0'),
  REDIS_PASSWORD: optionalString.default(undefined),
  REDIS_KEY_PREFIX: z.string().default('senvirox:'),

  SMTP_HOST: optionalString.default(undefined),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: optionalString.default(undefined),
  SMTP_PASS: optionalString.default(undefined),
  SMTP_FROM: z.string().default('noreply@senvirox.local'),

  SENTRY_DSN: optionalString.default(undefined),
  OTEL_EXPORTER_OTLP_ENDPOINT: optionalString.default(undefined),
  METRICS_TOKEN: optionalString.default(undefined),
});

export type Env = z.infer<typeof envSchema>;

const WEAK_JWT_PATTERN =
  /change-me|changeme|dev-only|localhost|local-foundation|your-jwt|secret-key|password|123456/i;

export function assertProductionSecrets(env: Env): void {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  if (env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }
  if (WEAK_JWT_PATTERN.test(env.JWT_SECRET)) {
    throw new Error('JWT_SECRET must not use development or placeholder values in production');
  }
  if (/localhost|127\.0\.0\.1/i.test(env.CORS_ORIGIN)) {
    throw new Error('CORS_ORIGIN must not use localhost in production');
  }
  if (!env.METRICS_TOKEN || env.METRICS_TOKEN.length < 24) {
    throw new Error('METRICS_TOKEN (>=24 chars) is required in production to protect /metrics');
  }

  const wantsSupabase =
    env.USER_STORE === 'supabase' ||
    (env.USER_STORE === 'auto' && Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY));

  if (env.USER_STORE === 'supabase' && (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error('USER_STORE=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  if (wantsSupabase && (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error('Supabase credentials incomplete for selected user store');
  }

  if (env.USER_STORE === 'memory') {
    throw new Error('USER_STORE=memory is not allowed in production');
  }
}

export function parseEnv(raw: NodeJS.ProcessEnv): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  const env = parsed.data;
  assertProductionSecrets(env);
  return env;
}

export const env: Env = parseEnv(process.env);

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isDevelopment = env.NODE_ENV === 'development';
