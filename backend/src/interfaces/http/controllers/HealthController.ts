import type { Request, Response } from 'express';
import type { ApiSuccessResponse, HealthCheckDto } from '@senvirox/shared';
import { HEALTH_STATUS } from '@senvirox/shared';
import type { HealthService } from '../../../application/services/HealthService.js';

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  getHealth = async (req: Request, res: Response): Promise<void> => {
    const data = await this.healthService.getHealth();
    const body: ApiSuccessResponse<HealthCheckDto> = {
      success: true,
      data,
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    };

    const statusCode = data.status === HEALTH_STATUS.DOWN ? 503 : 200;
    res.status(statusCode).json(body);
  };

  getLive = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'ok' });
  };

  getReady = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.healthService.getHealth();
    if (data.status === HEALTH_STATUS.DOWN) {
      res.status(503).json({ status: 'not_ready', checks: data.checks });
      return;
    }
    res.status(200).json({ status: 'ready', checks: data.checks });
  };
}
