import { createServer } from 'node:http';
import { appConfig } from './config/app.js';
import { createContainer } from './container.js';
import { createApp } from './app.js';
import { logger } from './infrastructure/logging/logger.js';

async function main(): Promise<void> {
  const container = createContainer();
  const app = createApp(container);
  const server = createServer(app);

  const shutdown = async (signal: string) => {
    logger.info('Shutdown signal received', { signal });
    server.close(async (err) => {
      if (err) {
        logger.error('Error during HTTP server close', { err });
        process.exitCode = 1;
      }
      try {
        await container.shutdown();
      } catch (shutdownErr) {
        logger.error('Error during container shutdown', { err: shutdownErr });
        process.exitCode = 1;
      }
      process.exit(process.exitCode ?? 0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { err: reason });
  });

  process.on('uncaughtException', (err) => {
    logger.fatal('Uncaught exception', { err });
    void shutdown('uncaughtException');
  });

  server.listen(appConfig.port, appConfig.host, () => {
    logger.info('SENVIROX API listening', {
      host: appConfig.host,
      port: appConfig.port,
      env: appConfig.env,
      apiPrefix: appConfig.apiPrefix,
    });
  });
}

main().catch((err: unknown) => {
  logger.fatal('Failed to start server', { err });
  process.exit(1);
});
