import { assertProductionSecrets, parseEnv, type Env } from '../src/config/env.js';

function baseEnv(
  overrides: Partial<Record<keyof Env, string | undefined>> = {},
): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'development',
    JWT_SECRET: 'local-foundation-jwt-secret-32b-min-value',
    CORS_ORIGIN: 'http://localhost:3000',
    ...overrides,
  };
}

function productionBase(
  overrides: Partial<Record<keyof Env, string | undefined>> = {},
): NodeJS.ProcessEnv {
  return baseEnv({
    NODE_ENV: 'production',
    JWT_SECRET: 'xK9mP2vL8qR4wN7tY3bH6cF1jD5sA0eU9iO2pZ4mQ7n',
    CORS_ORIGIN: 'https://app.senvirox.com',
    METRICS_TOKEN: 'metrics-token-at-least-24-chars',
    USER_STORE: 'file',
    DATA_DIR: '/data',
    ...overrides,
  });
}

describe('parseEnv / production guards', () => {
  it('parses development defaults', () => {
    const env = parseEnv(baseEnv());
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(5000);
    expect(env.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(env.JWT_REFRESH_EXPIRES_IN).toBe('7d');
    expect(env.AUTH_RATE_LIMIT_MAX).toBe(30);
    expect(env.USER_STORE).toBe('auto');
  });

  it('rejects production with weak JWT secret', () => {
    expect(() =>
      parseEnv(
        productionBase({
          JWT_SECRET: 'local-foundation-jwt-secret-32b-min-value',
        }),
      ),
    ).toThrow(/JWT_SECRET/);
  });

  it('rejects production without metrics token', () => {
    expect(() =>
      assertProductionSecrets({
        NODE_ENV: 'production',
        PORT: 5000,
        HOST: '0.0.0.0',
        API_PREFIX: '/api/v1',
        LOG_LEVEL: 'info',
        CORS_ORIGIN: 'https://app.senvirox.com',
        USER_STORE: 'file',
        DATA_DIR: '/data',
        SUPABASE_URL: undefined,
        SUPABASE_ANON_KEY: undefined,
        SUPABASE_SERVICE_ROLE_KEY: undefined,
        JWT_SECRET: 'a'.repeat(48),
        JWT_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
        JWT_ISSUER: 'senvirox',
        JWT_AUDIENCE: 'senvirox-api',
        RATE_LIMIT_WINDOW_MS: 900000,
        RATE_LIMIT_MAX: 200,
        DEVICE_RATE_LIMIT_MAX: 600,
        AUTH_RATE_LIMIT_MAX: 30,
        REDIS_URL: 'redis://redis:6379/0',
        REDIS_PASSWORD: undefined,
        REDIS_KEY_PREFIX: 'senvirox:',
        SMTP_HOST: undefined,
        SMTP_PORT: 587,
        SMTP_USER: undefined,
        SMTP_PASS: undefined,
        SMTP_FROM: 'noreply@senvirox.local',
        SENTRY_DSN: undefined,
        OTEL_EXPORTER_OTLP_ENDPOINT: undefined,
        METRICS_TOKEN: undefined,
      }),
    ).toThrow(/METRICS_TOKEN/);
  });

  it('accepts hardened production configuration with file store', () => {
    const env = parseEnv(productionBase());
    expect(env.NODE_ENV).toBe('production');
    expect(env.USER_STORE).toBe('file');
    expect(env.METRICS_TOKEN?.length).toBeGreaterThanOrEqual(24);
  });

  it('rejects production memory user store', () => {
    expect(() => parseEnv(productionBase({ USER_STORE: 'memory' }))).toThrow(/memory/);
  });
});
