import { createHash } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { isUserRole } from '@senvirox/shared';
import type {
  AccessTokenPayload,
  ITokenService,
  RefreshTokenPayload,
} from '../../application/ports/ITokenService.js';
import { appConfig } from '../../config/app.js';
import { AppError } from '../../domain/errors/AppError.js';

export class JwtTokenService implements ITokenService {
  private readonly secret: Uint8Array;

  constructor(secret = appConfig.jwt.secret) {
    this.secret = new TextEncoder().encode(secret);
  }

  async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return new SignJWT({
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
      typ: 'access',
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(payload.sub)
      .setIssuer(appConfig.jwt.issuer)
      .setAudience(appConfig.jwt.audience)
      .setIssuedAt()
      .setExpirationTime(appConfig.jwt.expiresIn)
      .sign(this.secret);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: appConfig.jwt.issuer,
        audience: appConfig.jwt.audience,
      });

      if (payload.typ !== undefined && payload.typ !== 'access') {
        throw AppError.unauthorized('Invalid access token type');
      }

      const sub = payload.sub;
      const email = typeof payload.email === 'string' ? payload.email : '';
      const role = typeof payload.role === 'string' ? payload.role : '';
      const organizationId =
        payload.organizationId === null || typeof payload.organizationId === 'string'
          ? (payload.organizationId as string | null)
          : null;

      if (!sub || !email || !isUserRole(role)) {
        throw AppError.unauthorized('Invalid token payload');
      }

      return { sub, email, role, organizationId };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw AppError.unauthorized('Invalid or expired token');
    }
  }

  async signRefreshToken(payload: Omit<RefreshTokenPayload, 'typ'>): Promise<string> {
    return new SignJWT({ typ: 'refresh' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(payload.sub)
      .setJti(payload.jti)
      .setIssuer(appConfig.jwt.issuer)
      .setAudience(appConfig.jwt.audience)
      .setIssuedAt()
      .setExpirationTime(appConfig.jwt.refreshExpiresIn)
      .sign(this.secret);
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: appConfig.jwt.issuer,
        audience: appConfig.jwt.audience,
      });

      if (payload.typ !== 'refresh') {
        throw AppError.unauthorized('Invalid refresh token type');
      }

      const sub = payload.sub;
      const jti = payload.jti;
      if (!sub || !jti) {
        throw AppError.unauthorized('Invalid refresh token payload');
      }

      return { sub, jti, typ: 'refresh' };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw AppError.unauthorized('Invalid or expired refresh token');
    }
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
