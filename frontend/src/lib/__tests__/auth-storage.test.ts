/**
 * @jest-environment jsdom
 */
import { authStorage } from '../auth-storage';
import type { AuthSessionDto } from '@senvirox/shared';

describe('authStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persists and clears session data', () => {
    const session: AuthSessionDto = {
      user: {
        id: 'u1',
        email: 'a@b.com',
        fullName: 'A',
        role: 'admin',
        organizationId: null,
      },
      tokens: {
        accessToken: 'access',
        refreshToken: 'refresh',
        tokenType: 'Bearer',
        expiresIn: '15m',
      },
    };

    authStorage.saveSession(session);
    expect(authStorage.getAccessToken()).toBe('access');
    expect(authStorage.getRefreshToken()).toBe('refresh');
    expect(authStorage.getUser()?.email).toBe('a@b.com');

    authStorage.clear();
    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getUser()).toBeNull();
  });
});
