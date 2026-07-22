import type {
  IRefreshTokenStore,
  RefreshTokenRecord,
} from '../../application/ports/IRefreshTokenStore.js';

export class InMemoryRefreshTokenStore implements IRefreshTokenStore {
  private readonly byHash = new Map<string, RefreshTokenRecord>();

  async save(record: RefreshTokenRecord): Promise<void> {
    this.byHash.set(record.tokenHash, record);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.byHash.get(tokenHash) ?? null;
  }

  async revokeByTokenHash(tokenHash: string, revokedAt = new Date()): Promise<void> {
    const existing = this.byHash.get(tokenHash);
    if (!existing) return;
    this.byHash.set(tokenHash, { ...existing, revokedAt });
  }

  async revokeAllForUser(userId: string, revokedAt = new Date()): Promise<number> {
    let count = 0;
    for (const [hash, record] of this.byHash.entries()) {
      if (record.userId === userId && !record.revokedAt) {
        this.byHash.set(hash, { ...record, revokedAt });
        count += 1;
      }
    }
    return count;
  }

  clear(): void {
    this.byHash.clear();
  }
}
