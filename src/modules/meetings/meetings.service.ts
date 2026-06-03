import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { CreateMeetingInput, ListMeetingsQuery } from './meetings.schema';

/**
 * Create a new meeting with participants and transcript segments.
 */
export const createMeeting = async (
  input: CreateMeetingInput,
  userId: string
) => {
  const meeting = await prisma.meeting.create({
    data: {
      title: input.title,
      meetingDate: new Date(input.meetingDate),
      createdBy: userId,
      participants: {
        create: input.participants.map((email) => ({ email })),
      },
      transcriptSegments: {
        create: input.transcript.map((seg) => ({
          timestamp: seg.timestamp,
          speaker: seg.speaker,
          text: seg.text,
        })),
      },
    },
    include: {
      participants: true,
      transcriptSegments: {
        orderBy: { timestamp: 'asc' },
      },
    },
  });

  return meeting;
};

/**
 * Get a single meeting by ID.
 * Only the creator can access their meeting.
 */
export const getMeetingById = async (meetingId: string, userId: string) => {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      participants: true,
      transcriptSegments: {
        orderBy: { timestamp: 'asc' },
      },
      analysis: true,
    },
  });

  if (!meeting) {
    throw new AppError('Meeting not found', 404, 'NOT_FOUND');
  }

  if (meeting.createdBy !== userId) {
    throw new AppError('You do not have access to this meeting', 403, 'FORBIDDEN');
  }

  return meeting;
};

/**
 * List meetings for the authenticated user with pagination and optional title filter.
 */
export const listMeetings = async (query: ListMeetingsQuery, userId: string) => {
  const { page, limit, title } = query;
  const skip = (page - 1) * limit;

  const where = {
    createdBy: userId,
    ...(title
      ? { title: { contains: title, mode: 'insensitive' as const } }
      : {}),
  };

  const [meetings, total] = await Promise.all([
    prisma.meeting.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        participants: true,
        _count: {
          select: { transcriptSegments: true, actionItems: true },
        },
      },
    }),
    prisma.meeting.count({ where }),
  ]);

  return {
    meetings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};
