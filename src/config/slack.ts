import axios from 'axios';
import { logger } from '../utils/logger';

// Returns false instead of throwing so the cron job keeps running even if Slack is down
export const sendSlackMessage = async (text: string): Promise<boolean> => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.warn({}, 'SLACK_WEBHOOK_URL not configured');
    return false;
  }

  try {
    await axios.post(webhookUrl, { text }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    logger.info({}, 'Slack message sent');
    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error({ status: error.response?.status, error: error.message }, 'Slack send failed');
    } else {
      logger.error({ error: String(error) }, 'Slack send failed');
    }
    return false;
  }
};
