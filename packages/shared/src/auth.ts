import type { UserRole } from './roles.js';
import type { AuthUserDto } from './types.js';

export interface LoginRequestDto {
  readonly email: string;
  readonly password: string;
}

export interface RegisterRequestDto {
  readonly email: string;
  readonly password: string;
  readonly fullName: string;
  readonly organizationId?: string | null;
}

export interface RefreshRequestDto {
  readonly refreshToken: string;
}

export interface LogoutRequestDto {
  readonly refreshToken: string;
}

export interface AuthTokensDto {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: string;
}

export interface AuthSessionDto {
  readonly user: AuthUserDto;
  readonly tokens: AuthTokensDto;
}

export interface ChangePasswordRequestDto {
  readonly currentPassword: string;
  readonly newPassword: string;
}

export type { AuthUserDto, UserRole };
