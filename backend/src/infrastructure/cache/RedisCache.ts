import { Redis } from 'ioredis';
import type { ICachePort } from '../../application/ports/ICachePort.js';
import { appConfig } from '../../config/app.js';
import { logger } from '../logging/logger.js';

export class RedisCache implements ICachePort {
  private readonly client: Redis;
  private readonly prefix: string;

  constructor(url = appConfig.redis.url, password = appConfig.redis.password) {
    this.prefix = appConfig.redis.keyPrefix;
    this.client = new Redis(url, {
      password: password || undefined,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });

    this.client.on('error', (err) => {
      logger.warn('Redis client error', { err });
    });
  }

  private k(key: string): string {
    return `${this.prefix}${key}`;
  }

  async connect(): Promise<void> {
    if (this.client.status === 'wait' || this.client.status === 'end') {
      await this.client.connect();
    }
  }

  async get(key: string): Promise<string | null> {
    await this.connect();
    return this.client.get(this.k(key));
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    await this.connect();
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(this.k(key), value, 'EX', ttlSeconds);
      return;
    }
    await this.client.set(this.k(key), value);
  }

  async del(key: string): Promise<void> {
    await this.connect();
    await this.client.del(this.k(key));
  }

  async ping(): Promise<boolean> {
    try {
      await this.connect();
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client.status !== 'end') {
      await this.client.quit();
    }
  }
}

/** In-memory cache for tests and Redis-less local runs. */
export class InMemoryCache implements ICachePort {
  private readonly store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async ping(): Promise<boolean> {
    return true;
  }

  async disconnect(): Promise<void> {
    this.store.clear();
  }
}
