import type { UserRole } from '@senvirox/shared';

export interface AccessTokenPayload {
  readonly sub: string;
  readonly email: string;
  readonly role: UserRole;
  readonly organizationId: string | null;
}

export interface RefreshTokenPayload {
  readonly sub: string;
  readonly jti: string;
  readonly typ: 'refresh';
}

export interface ITokenService {
  signAccessToken(payload: AccessTokenPayload): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenPayload>;
  signRefreshToken(payload: Omit<RefreshTokenPayload, 'typ'>): Promise<string>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
  hashToken(token: string): string;
}
