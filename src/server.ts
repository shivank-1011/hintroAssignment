import 'dotenv/config';
import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { startOverdueReminderJob } from './jobs/overdue-reminder.job';
import { logger } from './utils/logger';

const PORT = parseInt(process.env.PORT || '3000', 10);

const bootstrap = async (): Promise<void> => {
  await connectDatabase();
  startOverdueReminderJob();

  const server = app.listen(PORT, () => {
    logger.info(
      { port: PORT, env: process.env.NODE_ENV, swagger: `http://localhost:${PORT}/swagger` },
      `Hintro API running on port ${PORT}`
    );
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down gracefully');
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error({ error: String(reason) }, 'Unhandled Promise Rejection');
    process.exit(1);
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error({ error: error.message, stack: error.stack }, 'Uncaught Exception');
    process.exit(1);
  });
};

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
