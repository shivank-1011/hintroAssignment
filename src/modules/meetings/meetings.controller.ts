import { Request, Response, NextFunction } from 'express';
import { createMeetingSchema, listMeetingsSchema } from './meetings.schema';
import { createMeeting, getMeetingById, listMeetings } from './meetings.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';

/**
 * POST /api/meetings
 */
export const createMeetingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { body } = createMeetingSchema.parse({ body: req.body });
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const meeting = await createMeeting(body, req.user.userId);
    sendSuccess(res, req.traceId, meeting, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/meetings/:id
 */
export const getMeetingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const meeting = await getMeetingById(req.params.id as string, req.user.userId);
    sendSuccess(res, req.traceId, meeting);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/meetings
 */
export const listMeetingsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { query } = listMeetingsSchema.parse({ query: req.query });
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const result = await listMeetings(query, req.user.userId);
    sendSuccess(res, req.traceId, result);
  } catch (error) {
    next(error);
  }
};
