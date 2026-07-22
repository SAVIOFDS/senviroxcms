import request from 'supertest';
import express from 'express';
import { JwtTokenService } from '../src/infrastructure/http/JwtTokenService.js';
import { createAuthMiddleware } from '../src/interfaces/http/middleware/auth.js';
import { errorHandler } from '../src/interfaces/http/middleware/errorHandler.js';
import { requestIdMiddleware } from '../src/interfaces/http/middleware/requestId.js';
import { asyncHandler } from '../src/shared/asyncHandler.js';

describe('Auth middleware', () => {
  const tokenService = new JwtTokenService('test-jwt-secret-at-least-16-chars');
  const { authenticate, requireRole } = createAuthMiddleware(tokenService);

  const app = express();
  app.use(requestIdMiddleware);
  app.get(
    '/secure',
    authenticate,
    asyncHandler(async (req, res) => {
      res.json({ userId: req.user?.id, role: req.user?.role });
    }),
  );
  app.get(
    '/admin',
    authenticate,
    requireRole('admin'),
    asyncHandler(async (_req, res) => {
      res.json({ ok: true });
    }),
  );
  app.use(errorHandler);

  it('rejects missing bearer token', async () => {
    const res = await request(app).get('/secure').expect(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('accepts valid access token', async () => {
    const token = await tokenService.signAccessToken({
      sub: 'user-1',
      email: 'admin@senvirox.local',
      role: 'admin',
      organizationId: 'org-1',
    });

    const res = await request(app)
      .get('/secure')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.userId).toBe('user-1');
    expect(res.body.role).toBe('admin');
  });

  it('enforces minimum role', async () => {
    const token = await tokenService.signAccessToken({
      sub: 'user-2',
      email: 'viewer@senvirox.local',
      role: 'viewer',
      organizationId: null,
    });

    const res = await request(app)
      .get('/admin')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
