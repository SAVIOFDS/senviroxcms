import { Router } from 'express';
import type { HealthController } from '../controllers/HealthController.js';
import type { SystemController } from '../controllers/SystemController.js';
import type { AuthController } from '../controllers/AuthController.js';
import type { createAuthMiddleware } from '../middleware/auth.js';
import { createHealthRouter } from './health.routes.js';
import { createSystemRouter } from './system.routes.js';
import { createAuthRouter } from './auth.routes.js';

export interface RouteControllers {
  readonly health: HealthController;
  readonly system: SystemController;
  readonly auth: AuthController;
}

export function createApiRouter(
  controllers: RouteControllers,
  auth: ReturnType<typeof createAuthMiddleware>,
): Router {
  const router = Router();

  router.use('/health', createHealthRouter(controllers.health));
  router.use('/system', createSystemRouter(controllers.system));
  router.use('/auth', createAuthRouter(controllers.auth, auth));

  return router;
}
