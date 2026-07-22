import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const example = resolve(root, '.env.example');
const target = resolve(root, '.env');

if (!existsSync(example)) {
  console.error('Missing .env.example');
  process.exit(1);
}

if (existsSync(target)) {
  console.log('.env already exists — leaving unchanged');
  process.exit(0);
}

copyFileSync(example, target);
console.log('Created .env from .env.example');
