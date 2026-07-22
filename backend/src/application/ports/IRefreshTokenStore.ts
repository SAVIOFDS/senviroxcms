export interface RefreshTokenRecord {
  readonly tokenId: string;
  readonly userId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly revokedAt: Date | null;
  readonly userAgent: string | null;
  readonly ipAddress: string | null;
}

export interface IRefreshTokenStore {
  save(record: RefreshTokenRecord): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeByTokenHash(tokenHash: string, revokedAt?: Date): Promise<void>;
  revokeAllForUser(userId: string, revokedAt?: Date): Promise<number>;
}
