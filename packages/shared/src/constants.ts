/** Platform-wide constants shared by API and console. */

export const APP_NAME = 'SENVIROX' as const;

export const API_VERSION = 'v1' as const;

export const DEFAULT_PAGE_SIZE = 25 as const;
export const MAX_PAGE_SIZE = 100 as const;

export const HEARTBEAT_INTERVAL_MS = 60_000 as const;

export const DEVICE_STATUSES = ['online', 'offline', 'pairing', 'maintenance', 'error'] as const;

export const HEALTH_STATUS = {
  OK: 'ok',
  DEGRADED: 'degraded',
  DOWN: 'down',
} as const;
