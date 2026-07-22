import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import type { IPasswordHasher } from '../../application/ports/IPasswordHasher.js';

const KEYLEN = 64;
const SALT_BYTES = 16;

interface ScryptParams {
  readonly N: number;
  readonly r: number;
  readonly p: number;
}

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  params: ScryptParams,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, params, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(derivedKey);
    });
  });
}

/**
 * scrypt password hasher — no native bcrypt dependency required.
 * Stored format: scrypt$N$r$p$saltHex$keyHex
 */
export class ScryptPasswordHasher implements IPasswordHasher {
  private readonly params: ScryptParams = { N: 16384, r: 8, p: 1 };

  async hash(plain: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const derived = await scryptAsync(plain, salt, KEYLEN, this.params);
    const { N, r, p } = this.params;
    return `scrypt$${N}$${r}$${p}$${salt.toString('hex')}$${derived.toString('hex')}`;
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    const parts = hash.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') {
      return false;
    }
    const N = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    const salt = Buffer.from(parts[4], 'hex');
    const expected = Buffer.from(parts[5], 'hex');
    if (
      !Number.isFinite(N) ||
      !Number.isFinite(r) ||
      !Number.isFinite(p) ||
      expected.length === 0
    ) {
      return false;
    }

    const derived = await scryptAsync(plain, salt, expected.length, { N, r, p });
    if (derived.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(derived, expected);
  }
}
