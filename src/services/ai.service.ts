import { callGroq } from '../config/groq';
import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

interface Citation { timestamp: string; }
interface AnalysisItem { text: string; citations: Citation[]; }
interface ActionItemAI { task: string; assignee: string; dueDate: string; citations: Citation[]; }
interface AnalysisResult {
  summary: AnalysisItem[];
  decisions: AnalysisItem[];
  followUps: AnalysisItem[];
  actionItems: ActionItemAI[];
}

const buildPrompt = (transcript: Array<{ timestamp: string; speaker: string; text: string }>): string => {
  const transcriptText = transcript.map((seg) => `[${seg.timestamp}] ${seg.speaker}: ${seg.text}`).join('\n');

  return `You are a meeting intelligence assistant. Analyze the following meeting transcript and extract structured information.

CRITICAL RULES:
1. Use ONLY information explicitly stated in the transcript below.
2. DO NOT invent, assume, or add any information not present in the transcript.
3. Every item MUST include a "citations" array with at least one timestamp from the transcript.
4. Return ONLY valid JSON — no markdown, no explanation, no code blocks.

TRANSCRIPT:
${transcriptText}

Return a JSON object with EXACTLY this structure:
{
  "summary": [
    {
      "text": "A key point discussed in the meeting",
      "citations": [{"timestamp": "00:00"}]
    }
  ],
  "decisions": [
    {
      "text": "A decision that was made",
      "citations": [{"timestamp": "00:00"}]
    }
  ],
  "followUps": [
    {
      "text": "A follow-up item or open question",
      "citations": [{"timestamp": "00:00"}]
    }
  ],
  "actionItems": [
    {
      "task": "Specific task to be done",
      "assignee": "Person responsible (use 'Unassigned' if not specified)",
      "dueDate": "ISO 8601 date or empty string if not mentioned",
      "citations": [{"timestamp": "00:00"}]
    }
  ]
}`;
};

const validateAnalysisResult = (data: unknown): AnalysisResult => {
  if (typeof data !== 'object' || data === null) {
    throw new AppError('AI returned non-object response', 502, 'AI_INVALID_RESPONSE');
  }

  const obj = data as Record<string, unknown>;

  for (const field of ['summary', 'decisions', 'followUps', 'actionItems']) {
    if (!Array.isArray(obj[field])) {
      throw new AppError(`AI response missing required field: ${field}`, 502, 'AI_INVALID_RESPONSE');
    }
  }

  const allItems = [
    ...(obj.summary as AnalysisItem[]),
    ...(obj.decisions as AnalysisItem[]),
    ...(obj.followUps as AnalysisItem[]),
  ];

  for (const item of allItems) {
    if (!item.citations || !Array.isArray(item.citations) || item.citations.length === 0) {
      throw new AppError('AI response contains items without citations', 502, 'AI_MISSING_CITATIONS');
    }
  }

  for (const item of obj.actionItems as ActionItemAI[]) {
    if (!item.citations || !Array.isArray(item.citations) || item.citations.length === 0) {
      throw new AppError('AI action item missing citations', 502, 'AI_MISSING_CITATIONS');
    }
  }

  return obj as unknown as AnalysisResult;
};

export const analyzeMeeting = async (meetingId: string, userId: string) => {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { transcriptSegments: { orderBy: { timestamp: 'asc' } } },
  });

  if (!meeting) throw new AppError('Meeting not found', 404, 'NOT_FOUND');
  if (meeting.createdBy !== userId) throw new AppError('You do not have access to this meeting', 403, 'FORBIDDEN');
  if (meeting.transcriptSegments.length === 0) throw new AppError('Meeting has no transcript to analyze', 400, 'NO_TRANSCRIPT');

  logger.info({ meetingId }, 'Starting AI analysis');

  const rawResponse = await callGroq([
    { role: 'system', content: 'You are a meeting intelligence assistant. Always respond with valid JSON only.' },
    { role: 'user', content: buildPrompt(meeting.transcriptSegments) },
  ]);

  let parsedResponse: unknown;
  try {
    parsedResponse = JSON.parse(rawResponse);
  } catch (_err) {
    logger.error({ meetingId, rawResponse: rawResponse.substring(0, 500) }, 'AI returned invalid JSON');
    throw new AppError('AI returned invalid JSON', 502, 'AI_INVALID_JSON');
  }

  const analysisResult = validateAnalysisResult(parsedResponse);

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Delete existing action items for this meeting to prevent duplicates on re-analysis
    await tx.actionItem.deleteMany({
      where: { meetingId },
    });

    const analysis = await tx.meetingAnalysis.upsert({
      where: { meetingId },
      create: {
        meetingId,
        summary: analysisResult.summary as unknown as Prisma.InputJsonValue,
        decisions: analysisResult.decisions as unknown as Prisma.InputJsonValue,
        followUps: analysisResult.followUps as unknown as Prisma.InputJsonValue,
      },
      update: {
        summary: analysisResult.summary as unknown as Prisma.InputJsonValue,
        decisions: analysisResult.decisions as unknown as Prisma.InputJsonValue,
        followUps: analysisResult.followUps as unknown as Prisma.InputJsonValue,
      },
    });

    const actionItems = await Promise.all(
      analysisResult.actionItems.map((item) => {
        const parsedDueDate = (() => {
          if (!item.dueDate) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          const d = new Date(item.dueDate);
          return isNaN(d.getTime()) ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : d;
        })();

        return tx.actionItem.create({
          data: {
            meetingId,
            task: item.task,
            assignee: item.assignee || 'Unassigned',
            dueDate: parsedDueDate,
            citations: item.citations as unknown as Prisma.InputJsonValue,
            status: 'PENDING',
          },
        });
      })
    );

    return { analysis, actionItems };
  });

  logger.info(
    { meetingId, summaryCount: analysisResult.summary.length, actionItemsCount: result.actionItems.length },
    'AI analysis complete'
  );

  return {
    meetingId,
    analysis: result.analysis,
    actionItems: result.actionItems,
    stats: {
      summaryPoints: analysisResult.summary.length,
      decisions: analysisResult.decisions.length,
      followUps: analysisResult.followUps.length,
      actionItems: result.actionItems.length,
    },
  };
};
