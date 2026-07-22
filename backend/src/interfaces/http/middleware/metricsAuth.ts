import type { RequestHandler } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { appConfig } from '../../../config/app.js';
import { AppError } from '../../../domain/errors/AppError.js';

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

/**
 * Protects /metrics when METRICS_TOKEN is configured (required in production).
 * Development without a token remains open for local Prometheus scrapes.
 */
export const metricsAuthMiddleware: RequestHandler = (req, _res, next) => {
  const expected = appConfig.metricsToken;
  if (!expected) {
    next();
    return;
  }

  const header = req.header('authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    next(AppError.unauthorized('Metrics token required'));
    return;
  }

  const provided = header.slice(7).trim();
  if (!provided || !safeEqual(provided, expected)) {
    next(AppError.unauthorized('Invalid metrics token'));
    return;
  }

  next();
};
