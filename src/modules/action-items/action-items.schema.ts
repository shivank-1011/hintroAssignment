import { z } from 'zod';

const ActionItemStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']);

export const createActionItemSchema = z.object({
  body: z.object({
    meetingId: z.string().uuid('meetingId must be a valid UUID'),
    task: z.string().min(1, 'Task description is required'),
    assignee: z.string().min(1, 'Assignee is required'),
    dueDate: z.string().datetime('dueDate must be a valid ISO 8601 date'),
    citations: z
      .array(
        z.object({
          timestamp: z.string().min(1, 'Citation timestamp is required'),
        })
      )
      .optional()
      .default([]),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: ActionItemStatusEnum,
  }),
  params: z.object({
    id: z.string().uuid('Action item ID must be a valid UUID'),
  }),
});

export const listActionItemsSchema = z.object({
  query: z.object({
    status: ActionItemStatusEnum.optional(),
    assignee: z.string().optional(),
    meetingId: z.string().uuid().optional(),
    page: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 1))
      .pipe(z.number().int().min(1)),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 10))
      .pipe(z.number().int().min(1).max(100)),
  }),
});

export type CreateActionItemInput = z.infer<typeof createActionItemSchema>['body'];
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>['body'];
export type ListActionItemsQuery = z.infer<typeof listActionItemsSchema>['query'];
