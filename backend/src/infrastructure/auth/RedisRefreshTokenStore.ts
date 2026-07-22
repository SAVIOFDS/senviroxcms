import type {
  IRefreshTokenStore,
  RefreshTokenRecord,
} from '../../application/ports/IRefreshTokenStore.js';
import type { ICachePort } from '../../application/ports/ICachePort.js';
import { appConfig } from '../../config/app.js';

interface SerializedRefreshToken {
  tokenId: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
  userAgent: string | null;
  ipAddress: string | null;
}

/**
 * Redis-backed refresh token store.
 * Keys:
 *  - refresh:token:<hash> -> JSON record
 *  - refresh:user:<userId> -> set-like CSV of token hashes (simple membership)
 */
export class RedisRefreshTokenStore implements IRefreshTokenStore {
  constructor(private readonly cache: ICachePort) {}

  private tokenKey(hash: string): string {
    return `refresh:token:${hash}`;
  }

  private userKey(userId: string): string {
    return `refresh:user:${userId}`;
  }

  async save(record: RefreshTokenRecord): Promise<void> {
    const ttlSeconds = Math.max(1, Math.ceil((record.expiresAt.getTime() - Date.now()) / 1000));
    const payload: SerializedRefreshToken = {
      tokenId: record.tokenId,
      userId: record.userId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt.toISOString(),
      createdAt: record.createdAt.toISOString(),
      revokedAt: record.revokedAt ? record.revokedAt.toISOString() : null,
      userAgent: record.userAgent,
      ipAddress: record.ipAddress,
    };
    await this.cache.set(this.tokenKey(record.tokenHash), JSON.stringify(payload), ttlSeconds);

    const userKey = this.userKey(record.userId);
    const existing = await this.cache.get(userKey);
    const hashes = new Set(existing ? existing.split(',').filter(Boolean) : []);
    hashes.add(record.tokenHash);
    await this.cache.set(
      userKey,
      Array.from(hashes).join(','),
      Math.ceil(appConfig.jwt.refreshTtlMs / 1000),
    );
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const raw = await this.cache.get(this.tokenKey(tokenHash));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as SerializedRefreshToken;
      return {
        tokenId: parsed.tokenId,
        userId: parsed.userId,
        tokenHash: parsed.tokenHash,
        expiresAt: new Date(parsed.expiresAt),
        createdAt: new Date(parsed.createdAt),
        revokedAt: parsed.revokedAt ? new Date(parsed.revokedAt) : null,
        userAgent: parsed.userAgent,
        ipAddress: parsed.ipAddress,
      };
    } catch {
      return null;
    }
  }

  async revokeByTokenHash(tokenHash: string, revokedAt = new Date()): Promise<void> {
    const existing = await this.findByTokenHash(tokenHash);
    if (!existing) return;
    const ttlSeconds = Math.max(1, Math.ceil((existing.expiresAt.getTime() - Date.now()) / 1000));
    const next: RefreshTokenRecord = { ...existing, revokedAt };
    const payload: SerializedRefreshToken = {
      tokenId: next.tokenId,
      userId: next.userId,
      tokenHash: next.tokenHash,
      expiresAt: next.expiresAt.toISOString(),
      createdAt: next.createdAt.toISOString(),
      revokedAt: revokedAt.toISOString(),
      userAgent: next.userAgent,
      ipAddress: next.ipAddress,
    };
    await this.cache.set(this.tokenKey(tokenHash), JSON.stringify(payload), ttlSeconds);
  }

  async revokeAllForUser(userId: string, revokedAt = new Date()): Promise<number> {
    const raw = await this.cache.get(this.userKey(userId));
    if (!raw) return 0;
    const hashes = raw.split(',').filter(Boolean);
    let count = 0;
    for (const hash of hashes) {
      const existing = await this.findByTokenHash(hash);
      if (existing && !existing.revokedAt) {
        await this.revokeByTokenHash(hash, revokedAt);
        count += 1;
      }
    }
    return count;
  }
}
