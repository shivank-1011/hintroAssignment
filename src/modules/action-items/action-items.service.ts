import { ActionItemStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import {
  CreateActionItemInput,
  UpdateStatusInput,
  ListActionItemsQuery,
} from './action-items.schema';

/**
 * Create a new action item linked to a meeting.
 */
export const createActionItem = async (input: CreateActionItemInput, userId: string) => {
  // Verify the meeting exists and belongs to the user
  const meeting = await prisma.meeting.findUnique({
    where: { id: input.meetingId },
  });

  if (!meeting) {
    throw new AppError('Meeting not found', 404, 'NOT_FOUND');
  }

  if (meeting.createdBy !== userId) {
    throw new AppError('You do not have access to this meeting', 403, 'FORBIDDEN');
  }

  return prisma.actionItem.create({
    data: {
      meetingId: input.meetingId,
      task: input.task,
      assignee: input.assignee,
      dueDate: new Date(input.dueDate),
      citations: input.citations,
    },
  });
};

/**
 * Update the status of an action item.
 */
export const updateActionItemStatus = async (
  id: string,
  input: UpdateStatusInput,
  userId: string
) => {
  const actionItem = await prisma.actionItem.findUnique({
    where: { id },
    include: { meeting: true },
  });

  if (!actionItem) {
    throw new AppError('Action item not found', 404, 'NOT_FOUND');
  }

  if (actionItem.meeting.createdBy !== userId) {
    throw new AppError('You do not have access to this action item', 403, 'FORBIDDEN');
  }

  return prisma.actionItem.update({
    where: { id },
    data: { status: input.status as ActionItemStatus },
  });
};

/**
 * List action items with optional filters: status, assignee, meetingId.
 */
export const listActionItems = async (
  query: ListActionItemsQuery,
  userId: string
) => {
  const { status, assignee, meetingId, page, limit } = query;
  const skip = (page - 1) * limit;

  const where = {
    meeting: { createdBy: userId },
    ...(status ? { status: status as ActionItemStatus } : {}),
    ...(assignee ? { assignee: { contains: assignee, mode: 'insensitive' as const } } : {}),
    ...(meetingId ? { meetingId } : {}),
  };

  const [actionItems, total] = await Promise.all([
    prisma.actionItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { meeting: { select: { id: true, title: true } } },
    }),
    prisma.actionItem.count({ where }),
  ]);

  return {
    actionItems,
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

/**
 * Get all overdue action items (not completed and past due date).
 */
export const getOverdueActionItems = async (userId: string) => {
  return prisma.actionItem.findMany({
    where: {
      meeting: { createdBy: userId },
      status: { not: ActionItemStatus.COMPLETED },
      dueDate: { lt: new Date() },
    },
    orderBy: { dueDate: 'asc' },
    include: { meeting: { select: { id: true, title: true } } },
  });
};
