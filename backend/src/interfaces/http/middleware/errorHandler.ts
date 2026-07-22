import type { NextFunction, Request, Response } from 'express';
import type { ApiFailureResponse } from '@senvirox/shared';
import { ZodError } from 'zod';
import { AppError } from '../../../domain/errors/AppError.js';
import { logger } from '../../../infrastructure/logging/logger.js';
import { isProduction } from '../../../config/env.js';

export function notFoundHandler(req: Request, res: Response): void {
  const body: ApiFailureResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.requestId,
    },
  };
  res.status(404).json(body);
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    const body: ApiFailureResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: err.flatten(),
        requestId: req.requestId,
      },
    };
    res.status(400).json(body);
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Operational boundary crossed', { err, requestId: req.requestId });
    }
    const body: ApiFailureResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId: req.requestId,
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  logger.error('Unhandled error', { err, requestId: req.requestId });

  const body: ApiFailureResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProduction
        ? 'Internal server error'
        : err instanceof Error
          ? err.message
          : 'Unknown error',
      requestId: req.requestId,
    },
  };
  res.status(500).json(body);
}
