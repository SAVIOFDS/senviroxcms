import { randomUUID } from 'node:crypto';
import type {
  AuthSessionDto,
  AuthTokensDto,
  AuthUserDto,
  LoginRequestDto,
  RegisterRequestDto,
  UserRole,
} from '@senvirox/shared';
import { User } from '../../domain/entities/User.js';
import { AppError } from '../../domain/errors/AppError.js';
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import type { IPasswordHasher } from '../ports/IPasswordHasher.js';
import type { IRefreshTokenStore } from '../ports/IRefreshTokenStore.js';
import type { ITokenService } from '../ports/ITokenService.js';
import { appConfig } from '../../config/app.js';

export interface AuthRequestContext {
  readonly userAgent?: string | null;
  readonly ipAddress?: string | null;
}

export class AuthService {
  constructor(
    private readonly users: IUserRepository,
    private readonly passwords: IPasswordHasher,
    private readonly tokens: ITokenService,
    private readonly refreshStore: IRefreshTokenStore,
  ) {}

  async register(input: RegisterRequestDto, ctx: AuthRequestContext = {}): Promise<AuthSessionDto> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw AppError.conflict('An account with this email already exists');
    }

    this.assertPasswordPolicy(input.password);

    const count = await this.users.count();
    const role: UserRole = count === 0 ? 'super_admin' : 'viewer';

    const now = new Date();
    const user = User.create({
      id: randomUUID(),
      email,
      fullName: input.fullName.trim(),
      role,
      organizationId: input.organizationId ?? null,
      passwordHash: await this.passwords.hash(input.password),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const saved = await this.users.create(user);
    return this.issueSession(saved, ctx);
  }

  async login(input: LoginRequestDto, ctx: AuthRequestContext = {}): Promise<AuthSessionDto> {
    const email = input.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const valid = await this.passwords.verify(input.password, user.passwordHash);
    if (!valid) {
      throw AppError.unauthorized('Invalid email or password');
    }

    return this.issueSession(user, ctx);
  }

  async refresh(refreshToken: string, ctx: AuthRequestContext = {}): Promise<AuthSessionDto> {
    const payload = await this.tokens.verifyRefreshToken(refreshToken);
    const tokenHash = this.tokens.hashToken(refreshToken);
    const stored = await this.refreshStore.findByTokenHash(tokenHash);

    if (!stored || stored.revokedAt || stored.userId !== payload.sub) {
      throw AppError.unauthorized('Invalid refresh token');
    }
    if (stored.expiresAt.getTime() <= Date.now()) {
      throw AppError.unauthorized('Refresh token expired');
    }

    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('User is not active');
    }

    // Rotate refresh token
    await this.refreshStore.revokeByTokenHash(tokenHash);
    return this.issueSession(user, ctx);
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      await this.tokens.verifyRefreshToken(refreshToken);
    } catch {
      // Still attempt revoke by hash for defense in depth
    }
    const tokenHash = this.tokens.hashToken(refreshToken);
    await this.refreshStore.revokeByTokenHash(tokenHash);
  }

  async logoutAll(userId: string): Promise<number> {
    return this.refreshStore.revokeAllForUser(userId);
  }

  async me(userId: string): Promise<AuthUserDto> {
    const user = await this.users.findById(userId);
    if (!user || !user.isActive) {
      throw AppError.unauthorized();
    }
    return user.toAuthDto();
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user || !user.isActive) {
      throw AppError.unauthorized();
    }

    const valid = await this.passwords.verify(currentPassword, user.passwordHash);
    if (!valid) {
      throw AppError.unauthorized('Current password is incorrect');
    }

    this.assertPasswordPolicy(newPassword);
    const next = user.withPasswordHash(await this.passwords.hash(newPassword));
    await this.users.update(next);
    await this.refreshStore.revokeAllForUser(userId);
  }

  private async issueSession(user: User, ctx: AuthRequestContext): Promise<AuthSessionDto> {
    const accessToken = await this.tokens.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    const tokenId = randomUUID();
    const refreshToken = await this.tokens.signRefreshToken({
      sub: user.id,
      jti: tokenId,
    });

    const expiresAt = new Date(Date.now() + appConfig.jwt.refreshTtlMs);
    await this.refreshStore.save({
      tokenId,
      userId: user.id,
      tokenHash: this.tokens.hashToken(refreshToken),
      expiresAt,
      createdAt: new Date(),
      revokedAt: null,
      userAgent: ctx.userAgent ?? null,
      ipAddress: ctx.ipAddress ?? null,
    });

    const tokens: AuthTokensDto = {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: appConfig.jwt.expiresIn,
    };

    return {
      user: user.toAuthDto(),
      tokens,
    };
  }

  private assertPasswordPolicy(password: string): void {
    if (password.length < 10) {
      throw AppError.validation('Password must be at least 10 characters');
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      throw AppError.validation('Password must include letters and numbers');
    }
  }
}
