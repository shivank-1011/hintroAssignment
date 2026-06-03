import { Request, Response, NextFunction } from 'express';
import { analyzeMeeting } from '../../services/ai.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';

/**
 * POST /api/meetings/:id/analyze
 */
export const analyzeMeetingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const result = await analyzeMeeting(req.params.id as string, req.user.userId);
    sendSuccess(res, req.traceId, result);
  } catch (error) {
    next(error);
  }
};
