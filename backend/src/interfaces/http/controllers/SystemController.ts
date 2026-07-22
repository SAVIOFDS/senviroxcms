import type { Request, Response } from 'express';
import type { ApiSuccessResponse } from '@senvirox/shared';
import { appConfig } from '../../../config/app.js';

interface SystemInfoDto {
  readonly name: string;
  readonly version: string;
  readonly apiVersion: string;
  readonly environment: string;
  readonly node: string;
}

export class SystemController {
  getInfo = async (req: Request, res: Response): Promise<void> => {
    const data: SystemInfoDto = {
      name: appConfig.name,
      version: appConfig.version,
      apiVersion: appConfig.apiVersion,
      environment: appConfig.env,
      node: process.version,
    };

    const body: ApiSuccessResponse<SystemInfoDto> = {
      success: true,
      data,
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    };
    res.status(200).json(body);
  };
}
