import { Router } from 'express';
import type { SystemController } from '../controllers/SystemController.js';
import { asyncHandler } from '../../../shared/asyncHandler.js';

export function createSystemRouter(controller: SystemController): Router {
  const router = Router();
  router.get('/info', asyncHandler(controller.getInfo));
  return router;
}
