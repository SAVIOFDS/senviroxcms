import { Router } from 'express';
import type { AuthController } from '../controllers/AuthController.js';
import type { createAuthMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../../../shared/asyncHandler.js';

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export function createAuthRouter(controller: AuthController, auth: AuthMiddleware): Router {
  const router = Router();

  router.post('/register', asyncHandler(controller.register));
  router.post('/login', asyncHandler(controller.login));
  router.post('/refresh', asyncHandler(controller.refresh));
  router.post('/logout', asyncHandler(controller.logout));

  router.get('/me', auth.authenticate, asyncHandler(controller.me));
  router.post('/logout-all', auth.authenticate, asyncHandler(controller.logoutAll));
  router.post('/change-password', auth.authenticate, asyncHandler(controller.changePassword));

  // Example RBAC-protected probe for operators and above
  router.get(
    '/admin-probe',
    auth.authenticate,
    auth.requireRole('admin'),
    asyncHandler(async (req, res) => {
      res.status(200).json({
        success: true,
        data: {
          ok: true,
          userId: req.user?.id,
          role: req.user?.role,
        },
      });
    }),
  );

  return router;
}
