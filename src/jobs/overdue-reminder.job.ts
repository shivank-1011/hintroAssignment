import cron from 'node-cron';
import { processOverdueReminders } from '../services/reminder.service';
import { logger } from '../utils/logger';

// Runs every hour: finds items where status != COMPLETED and dueDate < now, sends Slack reminders
export const startOverdueReminderJob = (): void => {
  const schedule = '0 * * * *';

  cron.schedule(schedule, async () => {
    logger.info({ schedule }, 'Overdue reminder job triggered');
    try {
      await processOverdueReminders();
    } catch (error) {
      logger.error({ error: String(error) }, 'Overdue reminder job failed');
    }
  });

  logger.info({ schedule }, 'Overdue reminder cron scheduled');
};
