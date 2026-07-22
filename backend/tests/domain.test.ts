import { hasMinimumRole, isUserRole } from '@senvirox/shared';
import { User } from '../src/domain/entities/User.js';
import { AppError } from '../src/domain/errors/AppError.js';
import { HealthService } from '../src/application/services/HealthService.js';
import { InMemoryCache } from '../src/infrastructure/cache/RedisCache.js';
import { NoopDatabase } from '../src/infrastructure/database/SupabaseClient.js';

describe('Domain', () => {
  it('creates a valid user entity', () => {
    const user = User.create({
      id: 'u1',
      email: 'ops@senvirox.local',
      fullName: 'Ops User',
      role: 'operator',
      organizationId: 'org-1',
      passwordHash: 'scrypt$test',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(user.email).toBe('ops@senvirox.local');
    expect(user.toJSON().role).toBe('operator');
    expect(user.toJSON()).not.toHaveProperty('passwordHash');
    expect(user.toAuthDto().email).toBe('ops@senvirox.local');
  });

  it('rejects invalid email on user create', () => {
    expect(() =>
      User.create({
        id: 'u2',
        email: 'not-an-email',
        fullName: 'Bad',
        role: 'viewer',
        organizationId: null,
        passwordHash: 'x',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow(/email/i);
  });

  it('maps app errors to status codes', () => {
    expect(AppError.notFound('Device').statusCode).toBe(404);
    expect(AppError.validation('bad').code).toBe('VALIDATION_ERROR');
  });

  it('evaluates RBAC ranks', () => {
    expect(isUserRole('admin')).toBe(true);
    expect(isUserRole('nope')).toBe(false);
    expect(hasMinimumRole('admin', 'manager')).toBe(true);
    expect(hasMinimumRole('viewer', 'manager')).toBe(false);
  });

  it('health service reports degraded without supabase', async () => {
    const service = new HealthService(new InMemoryCache(), new NoopDatabase());
    const health = await service.getHealth();
    expect(health.checks.redis).toBe('ok');
    expect(health.checks.supabase).toBe('degraded');
    expect(['ok', 'degraded']).toContain(health.status);
  });
});
