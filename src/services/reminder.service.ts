import { sendSlackMessage } from '../config/slack';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export const sendOverdueReminder = async (actionItemId: string): Promise<void> => {
  const actionItem = await prisma.actionItem.findUnique({
    where: { id: actionItemId },
    include: { meeting: { select: { title: true } } },
  });

  if (!actionItem) {
    logger.warn({ actionItemId }, 'Action item not found for reminder');
    return;
  }

  const dueDateStr = actionItem.dueDate.toISOString().split('T')[0];
  const message =
    `*Overdue Action Item Reminder*\n\n` +
    `*Task:* ${actionItem.task}\n` +
    `*Assigned To:* ${actionItem.assignee}\n` +
    `*Due Date:* ${dueDateStr}\n` +
    `*Meeting:* ${actionItem.meeting.title}\n` +
    `*Status:* ${actionItem.status}`;

  const success = await sendSlackMessage(message);

  await prisma.reminderHistory.create({
    data: {
      actionItemId,
      provider: 'slack',
      responseStatus: success ? 'success' : 'failed',
    },
  });

  logger.info({ actionItemId, assignee: actionItem.assignee, success }, 'Reminder processed');
};

// Called by the cron job — finds all overdue items and sends Slack reminders
export const processOverdueReminders = async (): Promise<void> => {
  const overdueItems = await prisma.actionItem.findMany({
    where: {
      status: { not: 'COMPLETED' },
      dueDate: { lt: new Date() },
    },
    select: { id: true },
  });

  if (overdueItems.length === 0) {
    logger.info({}, 'No overdue items found');
    return;
  }

  logger.info({ count: overdueItems.length }, 'Processing overdue reminders');

  for (const item of overdueItems) {
    await sendOverdueReminder(item.id);
  }

  logger.info({ count: overdueItems.length }, 'Overdue reminders complete');
};
