import type { Request, Response } from 'express';
import type { ApiSuccessResponse, AuthSessionDto, AuthUserDto } from '@senvirox/shared';
import type { AuthService } from '../../../application/services/AuthService.js';
import { AppError } from '../../../domain/errors/AppError.js';
import {
  changePasswordBodySchema,
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
  registerBodySchema,
} from '../validators/auth.validators.js';

function requestContext(req: Request) {
  return {
    userAgent: req.header('user-agent') ?? null,
    ipAddress: req.ip ?? null,
  };
}

function ok<T>(req: Request, res: Response, data: T, status = 200): void {
  const body: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    },
  };
  res.status(status).json(body);
}

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const input = registerBodySchema.parse(req.body);
    const session = await this.authService.register(input, requestContext(req));
    ok<AuthSessionDto>(req, res, session, 201);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const input = loginBodySchema.parse(req.body);
    const session = await this.authService.login(input, requestContext(req));
    ok<AuthSessionDto>(req, res, session);
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const input = refreshBodySchema.parse(req.body);
    const session = await this.authService.refresh(input.refreshToken, requestContext(req));
    ok<AuthSessionDto>(req, res, session);
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const input = logoutBodySchema.parse(req.body);
    await this.authService.logout(input.refreshToken);
    ok(req, res, { loggedOut: true });
  };

  logoutAll = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const count = await this.authService.logoutAll(req.user.id);
    ok(req, res, { revokedSessions: count });
  };

  me = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const user = await this.authService.me(req.user.id);
    ok<AuthUserDto>(req, res, user);
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const input = changePasswordBodySchema.parse(req.body);
    await this.authService.changePassword(req.user.id, input.currentPassword, input.newPassword);
    ok(req, res, { passwordChanged: true });
  };
}
