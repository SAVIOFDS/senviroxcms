'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  AuthSessionDto,
  AuthUserDto,
  LoginRequestDto,
  RegisterRequestDto,
} from '@senvirox/shared';
import { ApiClientError, apiClient } from '@/lib/api-client';
import { authStorage } from '@/lib/auth-storage';

interface AuthState {
  readonly user: AuthUserDto | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly login: (input: LoginRequestDto) => Promise<void>;
  readonly register: (input: RegisterRequestDto) => Promise<void>;
  readonly logout: () => Promise<void>;
  readonly refreshProfile: () => Promise<void>;
}

function applySession(session: AuthSessionDto): AuthUserDto {
  authStorage.saveSession(session);
  return session.user;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUserDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    const token = authStorage.getAccessToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await apiClient.me();
      setUser(me);
      setError(null);
    } catch (err) {
      const refreshToken = authStorage.getRefreshToken();
      if (refreshToken) {
        try {
          const session = await apiClient.refresh(refreshToken);
          setUser(applySession(session));
          setError(null);
          return;
        } catch {
          authStorage.clear();
        }
      } else {
        authStorage.clear();
      }
      setUser(null);
      if (err instanceof ApiClientError && err.status !== 401) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const login = useCallback(async (input: LoginRequestDto) => {
    setLoading(true);
    setError(null);
    try {
      const session = await apiClient.login(input);
      setUser(applySession(session));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (input: RegisterRequestDto) => {
    setLoading(true);
    setError(null);
    try {
      const session = await apiClient.register(input);
      setUser(applySession(session));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = authStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await apiClient.logout(refreshToken);
      }
    } catch {
      // Local logout still proceeds
    } finally {
      authStorage.clear();
      setUser(null);
    }
  }, []);

  return { user, loading, error, login, register, logout, refreshProfile };
}
