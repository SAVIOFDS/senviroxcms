import type {
  ApiResponse,
  AuthSessionDto,
  AuthUserDto,
  HealthCheckDto,
  LoginRequestDto,
  RegisterRequestDto,
} from '@senvirox/shared';
import { publicEnv } from './env';
import { authStorage } from './auth-storage';

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export interface RequestOptions {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly token?: string;
  readonly body?: unknown;
  readonly signal?: AbortSignal;
  readonly cache?: RequestCache;
  readonly auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${publicEnv.NEXT_PUBLIC_API_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = options.token ?? (options.auth ? authStorage.getAccessToken() : null);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    cache: options.cache ?? 'no-store',
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError('Invalid JSON response from API', response.status);
  }

  if (!response.ok || !payload.success) {
    const message =
      payload && !payload.success ? payload.error.message : `Request failed (${response.status})`;
    const code = payload && !payload.success ? payload.error.code : undefined;
    throw new ApiClientError(message, response.status, code);
  }

  return payload.data;
}

export const apiClient = {
  getHealth(signal?: AbortSignal): Promise<HealthCheckDto> {
    return request<HealthCheckDto>('/health', { signal });
  },

  getSystemInfo(signal?: AbortSignal): Promise<{
    name: string;
    version: string;
    apiVersion: string;
    environment: string;
    node: string;
  }> {
    return request('/system/info', { signal });
  },

  register(body: RegisterRequestDto): Promise<AuthSessionDto> {
    return request<AuthSessionDto>('/auth/register', { method: 'POST', body });
  },

  login(body: LoginRequestDto): Promise<AuthSessionDto> {
    return request<AuthSessionDto>('/auth/login', { method: 'POST', body });
  },

  refresh(refreshToken: string): Promise<AuthSessionDto> {
    return request<AuthSessionDto>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    });
  },

  logout(refreshToken: string): Promise<{ loggedOut: boolean }> {
    return request('/auth/logout', { method: 'POST', body: { refreshToken } });
  },

  me(): Promise<AuthUserDto> {
    return request<AuthUserDto>('/auth/me', { auth: true });
  },

  changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ passwordChanged: boolean }> {
    return request('/auth/change-password', {
      method: 'POST',
      auth: true,
      body: { currentPassword, newPassword },
    });
  },
};
