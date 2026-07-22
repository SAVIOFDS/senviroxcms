import express, { type Application, type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { appConfig } from './config/app.js';
import { isProduction, isTest } from './config/env.js';
import type { AppContainer } from './container.js';
import { createApiRouter } from './interfaces/http/routes/index.js';
import { requestIdMiddleware } from './interfaces/http/middleware/requestId.js';
import { errorHandler, notFoundHandler } from './interfaces/http/middleware/errorHandler.js';
import { metricsHandler, metricsMiddleware } from './interfaces/http/middleware/metrics.js';
import { metricsAuthMiddleware } from './interfaces/http/middleware/metricsAuth.js';
import { asyncHandler } from './shared/asyncHandler.js';

export function createApp(container: AppContainer): Express {
  const app: Application = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestIdMiddleware);
  app.use(metricsMiddleware);

  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            useDefaults: true,
            directives: {
              defaultSrc: ["'none'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );

  app.use(
    cors({
      origin: appConfig.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
      maxAge: 600,
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  if (!isTest) {
    app.use(
      morgan(isProduction ? 'combined' : 'dev', {
        skip: (req) =>
          req.path === '/health' || req.path === '/metrics' || req.path.startsWith('/health/'),
      }),
    );
  }

  const limiter = rateLimit({
    windowMs: appConfig.rateLimit.windowMs,
    max: appConfig.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests, please try again later',
      },
    },
  });
  app.use(limiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: appConfig.rateLimit.authMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many authentication attempts, please try again later',
      },
    },
  });
  app.use(`${appConfig.apiPrefix}/auth/login`, authLimiter);
  app.use(`${appConfig.apiPrefix}/auth/register`, authLimiter);
  app.use(`${appConfig.apiPrefix}/auth/refresh`, authLimiter);

  app.get(
    '/health',
    asyncHandler(async (req, res) => container.controllers.health.getHealth(req, res)),
  );
  app.get(
    '/health/live',
    asyncHandler(async (req, res) => container.controllers.health.getLive(req, res)),
  );
  app.get(
    '/health/ready',
    asyncHandler(async (req, res) => container.controllers.health.getReady(req, res)),
  );

  app.get('/metrics', metricsAuthMiddleware, asyncHandler(metricsHandler));

  app.use(appConfig.apiPrefix, createApiRouter(container.controllers, container.auth));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app as Express;
}
