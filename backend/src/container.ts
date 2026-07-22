import { join } from 'node:path';
import { HealthService } from './application/services/HealthService.js';
import { AuthService } from './application/services/AuthService.js';
import type { ICachePort } from './application/ports/ICachePort.js';
import type { IDatabasePort } from './application/ports/IDatabasePort.js';
import type { ITokenService } from './application/ports/ITokenService.js';
import type { IUserRepository } from './domain/repositories/IUserRepository.js';
import type { IPasswordHasher } from './application/ports/IPasswordHasher.js';
import type { IRefreshTokenStore } from './application/ports/IRefreshTokenStore.js';
import { InMemoryCache, RedisCache } from './infrastructure/cache/RedisCache.js';
import { SupabaseDatabase } from './infrastructure/database/SupabaseClient.js';
import { JwtTokenService } from './infrastructure/http/JwtTokenService.js';
import { ScryptPasswordHasher } from './infrastructure/security/ScryptPasswordHasher.js';
import { InMemoryUserRepository } from './infrastructure/auth/InMemoryUserRepository.js';
import { FileUserRepository } from './infrastructure/auth/FileUserRepository.js';
import { SupabaseUserRepository } from './infrastructure/auth/SupabaseUserRepository.js';
import { InMemoryRefreshTokenStore } from './infrastructure/auth/InMemoryRefreshTokenStore.js';
import { RedisRefreshTokenStore } from './infrastructure/auth/RedisRefreshTokenStore.js';
import { HealthController } from './interfaces/http/controllers/HealthController.js';
import { SystemController } from './interfaces/http/controllers/SystemController.js';
import { AuthController } from './interfaces/http/controllers/AuthController.js';
import { createAuthMiddleware } from './interfaces/http/middleware/auth.js';
import { appConfig } from './config/app.js';
import { isTest } from './config/env.js';
import { logger } from './infrastructure/logging/logger.js';

export interface AppContainer {
  readonly cache: ICachePort;
  readonly database: IDatabasePort;
  readonly tokenService: ITokenService;
  readonly userRepository: IUserRepository;
  readonly passwordHasher: IPasswordHasher;
  readonly refreshTokenStore: IRefreshTokenStore;
  readonly healthService: HealthService;
  readonly authService: AuthService;
  readonly controllers: {
    readonly health: HealthController;
    readonly system: SystemController;
    readonly auth: AuthController;
  };
  readonly auth: ReturnType<typeof createAuthMiddleware>;
  shutdown(): Promise<void>;
}

function resolveUserRepository(options?: {
  readonly useMemoryCache?: boolean;
  readonly userRepository?: IUserRepository;
}): IUserRepository {
  if (options?.userRepository) {
    return options.userRepository;
  }

  const mode = appConfig.userStore;
  const supabaseReady = Boolean(appConfig.supabase.url && appConfig.supabase.serviceRoleKey);

  if (mode === 'memory' || isTest) {
    return new InMemoryUserRepository();
  }
  if (mode === 'supabase') {
    return new SupabaseUserRepository();
  }
  if (mode === 'file') {
    return new FileUserRepository(join(appConfig.dataDir, 'users.json'));
  }

  // auto
  if (supabaseReady) {
    logger.info('User store: supabase');
    return new SupabaseUserRepository();
  }
  logger.info('User store: file', { path: join(appConfig.dataDir, 'users.json') });
  return new FileUserRepository(join(appConfig.dataDir, 'users.json'));
}

export function createContainer(options?: {
  readonly useMemoryCache?: boolean;
  readonly userRepository?: IUserRepository;
  readonly refreshTokenStore?: IRefreshTokenStore;
}): AppContainer {
  const useMemory = options?.useMemoryCache ?? isTest;

  const cache: ICachePort = useMemory ? new InMemoryCache() : new RedisCache();
  const database: IDatabasePort = new SupabaseDatabase();
  const tokenService: ITokenService = new JwtTokenService();
  const passwordHasher: IPasswordHasher = new ScryptPasswordHasher();
  const userRepository = resolveUserRepository(options);
  const refreshTokenStore: IRefreshTokenStore =
    options?.refreshTokenStore ??
    (useMemory ? new InMemoryRefreshTokenStore() : new RedisRefreshTokenStore(cache));

  const healthService = new HealthService(cache, database);
  const authService = new AuthService(
    userRepository,
    passwordHasher,
    tokenService,
    refreshTokenStore,
  );

  const controllers = {
    health: new HealthController(healthService),
    system: new SystemController(),
    auth: new AuthController(authService),
  };

  const auth = createAuthMiddleware(tokenService);

  return {
    cache,
    database,
    tokenService,
    userRepository,
    passwordHasher,
    refreshTokenStore,
    healthService,
    authService,
    controllers,
    auth,
    async shutdown() {
      await cache.disconnect();
    },
  };
}
