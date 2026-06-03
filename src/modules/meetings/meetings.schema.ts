import { z } from 'zod';

const transcriptSegmentSchema = z.object({
  timestamp: z.string().min(1, 'Timestamp is required'),
  speaker: z.string().min(1, 'Speaker is required'),
  text: z.string().min(1, 'Text is required'),
});

export const createMeetingSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
    meetingDate: z.string().datetime('meetingDate must be a valid ISO 8601 date'),
    participants: z
      .array(z.string().email('Each participant must be a valid email'))
      .optional()
      .default([]),
    transcript: z
      .array(transcriptSegmentSchema)
      .min(1, 'Transcript must have at least one segment'),
  }),
});

export const listMeetingsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 1))
      .pipe(z.number().int().min(1, 'page must be >= 1')),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 10))
      .pipe(z.number().int().min(1).max(100, 'limit must be <= 100')),
    title: z.string().optional(),
  }),
});

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>['body'];
export type ListMeetingsQuery = z.infer<typeof listMeetingsSchema>['query'];
