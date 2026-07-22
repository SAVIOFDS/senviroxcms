import type { AuthSessionDto, AuthUserDto } from '@senvirox/shared';

const ACCESS_KEY = 'senvirox.accessToken';
const REFRESH_KEY = 'senvirox.refreshToken';
const USER_KEY = 'senvirox.user';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export const authStorage = {
  saveSession(session: AuthSessionDto): void {
    if (!canUseStorage()) return;
    window.localStorage.setItem(ACCESS_KEY, session.tokens.accessToken);
    window.localStorage.setItem(REFRESH_KEY, session.tokens.refreshToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  },

  clear(): void {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem(USER_KEY);
  },

  getAccessToken(): string | null {
    if (!canUseStorage()) return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },

  getRefreshToken(): string | null {
    if (!canUseStorage()) return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },

  getUser(): AuthUserDto | null {
    if (!canUseStorage()) return null;
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUserDto;
    } catch {
      return null;
    }
  },
};
