import { Router } from 'express';
import type { HealthController } from '../controllers/HealthController.js';
import { asyncHandler } from '../../../shared/asyncHandler.js';

export function createHealthRouter(controller: HealthController): Router {
  const router = Router();

  router.get('/', asyncHandler(controller.getHealth));
  router.get('/live', asyncHandler(controller.getLive));
  router.get('/ready', asyncHandler(controller.getReady));

  return router;
}
