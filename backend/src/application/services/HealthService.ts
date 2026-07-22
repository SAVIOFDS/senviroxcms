import { HEALTH_STATUS, type HealthCheckDto, type HealthStatus } from '@senvirox/shared';
import type { ICachePort } from '../ports/ICachePort.js';
import type { IDatabasePort } from '../ports/IDatabasePort.js';
import { appConfig } from '../../config/app.js';

export class HealthService {
  private readonly startedAt = Date.now();

  constructor(
    private readonly cache: ICachePort,
    private readonly database: IDatabasePort,
  ) {}

  async getHealth(): Promise<HealthCheckDto> {
    const [redisOk, supabaseOk] = await Promise.all([
      this.safePing(() => this.cache.ping()),
      this.safePing(() => this.database.ping()),
    ]);

    const redis: HealthStatus = redisOk ? HEALTH_STATUS.OK : HEALTH_STATUS.DEGRADED;
    const supabase: HealthStatus = !this.database.isConfigured()
      ? HEALTH_STATUS.DEGRADED
      : supabaseOk
        ? HEALTH_STATUS.OK
        : HEALTH_STATUS.DEGRADED;

    const status = this.aggregateStatus(redis, supabase);

    return {
      status,
      service: appConfig.name,
      version: appConfig.version,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
      checks: {
        redis,
        supabase,
      },
    };
  }

  private aggregateStatus(...statuses: HealthStatus[]): HealthStatus {
    if (statuses.every((s) => s === HEALTH_STATUS.OK)) {
      return HEALTH_STATUS.OK;
    }
    if (statuses.some((s) => s === HEALTH_STATUS.DOWN)) {
      return HEALTH_STATUS.DOWN;
    }
    return HEALTH_STATUS.DEGRADED;
  }

  private async safePing(fn: () => Promise<boolean>): Promise<boolean> {
    try {
      return await fn();
    } catch {
      return false;
    }
  }
}
