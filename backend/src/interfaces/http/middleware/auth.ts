import type { UserRole } from '@senvirox/shared';
import { hasMinimumRole } from '@senvirox/shared';
import type { ITokenService } from '../../../application/ports/ITokenService.js';
import { AppError } from '../../../domain/errors/AppError.js';
import { asyncHandler } from '../../../shared/asyncHandler.js';

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly role: UserRole;
  readonly organizationId: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function createAuthMiddleware(tokenService: ITokenService) {
  const authenticate = asyncHandler(async (req, _res, next) => {
    const header = req.header('authorization');
    if (!header || !header.toLowerCase().startsWith('bearer ')) {
      throw AppError.unauthorized();
    }
    const token = header.slice(7).trim();
    if (!token) {
      throw AppError.unauthorized();
    }

    const payload = await tokenService.verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      organizationId: payload.organizationId,
    };
    next();
  });

  const requireRole = (minimum: UserRole) =>
    asyncHandler(async (req, _res, next) => {
      if (!req.user) {
        throw AppError.unauthorized();
      }
      if (!hasMinimumRole(req.user.role, minimum)) {
        throw AppError.forbidden();
      }
      next();
    });

  return { authenticate, requireRole };
}
