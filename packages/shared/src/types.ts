import type { DEVICE_STATUSES, HEALTH_STATUS } from './constants.js';
import type { UserRole } from './roles.js';

export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

export type HealthStatus = (typeof HEALTH_STATUS)[keyof typeof HEALTH_STATUS];

export interface ApiErrorBody {
  readonly code: string;
  readonly message: string;
  readonly details?: unknown;
  readonly requestId?: string;
}

export interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: {
    readonly requestId?: string;
    readonly timestamp?: string;
  };
}

export interface ApiFailureResponse {
  readonly success: false;
  readonly error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiFailureResponse;

export interface PaginationMeta {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface PaginatedData<T> {
  readonly items: readonly T[];
  readonly pagination: PaginationMeta;
}

export interface AuthUserDto {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: UserRole;
  readonly organizationId: string | null;
}

export interface HealthCheckDto {
  readonly status: HealthStatus;
  readonly service: string;
  readonly version: string;
  readonly uptimeSeconds: number;
  readonly timestamp: string;
  readonly checks: {
    readonly redis: HealthStatus;
    readonly supabase: HealthStatus;
  };
}

export interface DeviceHeartbeatDto {
  readonly deviceId: string;
  readonly status: DeviceStatus;
  readonly timestamp: number;
  readonly cpuUsage?: number;
  readonly memoryUsage?: number;
  readonly storageUsed?: number;
}
