import { randomBytes } from 'node:crypto';
import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const target = resolve(root, '.env');

function secret(bytes = 48) {
  return randomBytes(bytes).toString('base64url');
}

const domain = process.argv[2] || 'app.example.com';
const publicUrl = domain.startsWith('http') ? domain : `https://${domain}`;
const apiUrl = `${publicUrl.replace(/\/$/, '')}/api/v1`;

const values = {
  NODE_ENV: 'production',
  LOG_LEVEL: 'info',
  NEXT_PUBLIC_APP_NAME: 'SENVIROX',
  NEXT_PUBLIC_APP_URL: publicUrl,
  NEXT_PUBLIC_API_URL: apiUrl,
  NEXT_PUBLIC_SUPABASE_URL: '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: '',
  PORT: '5000',
  HOST: '0.0.0.0',
  API_PREFIX: '/api/v1',
  CORS_ORIGIN: publicUrl,
  USER_STORE: 'file',
  DATA_DIR: '/data',
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
  JWT_SECRET: secret(48),
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  JWT_ISSUER: 'senvirox',
  JWT_AUDIENCE: 'senvirox-api',
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX: '300',
  DEVICE_RATE_LIMIT_MAX: '600',
  AUTH_RATE_LIMIT_MAX: '30',
  REDIS_PASSWORD: secret(32),
  REDIS_URL: 'redis://redis:6379/0',
  REDIS_KEY_PREFIX: 'senvirox:',
  METRICS_TOKEN: secret(32),
  SMTP_HOST: '',
  SMTP_PORT: '587',
  SMTP_USER: '',
  SMTP_PASS: '',
  SMTP_FROM: `noreply@${domain.replace(/^https?:\/\//, '')}`,
  IMAGE_TAG: 'latest',
};

const body = Object.entries(values)
  .map(([k, v]) => `${k}=${v}`)
  .join('\n')
  .concat('\n');

if (existsSync(target) && process.argv[3] !== '--force') {
  console.error(`.env already exists at ${target}`);
  console.error('Re-run with: node scripts/generate-secrets.mjs <domain> --force');
  process.exit(1);
}

writeFileSync(target, body, { mode: 0o600 });
console.log(`Wrote production .env for ${publicUrl}`);
console.log('Next: place TLS certs in deploy/ssl/ then docker compose up -d --build');
