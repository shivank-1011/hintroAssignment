import { Request, Response, NextFunction } from 'express';
import {
  createActionItemSchema,
  updateStatusSchema,
  listActionItemsSchema,
} from './action-items.schema';
import {
  createActionItem,
  updateActionItemStatus,
  listActionItems,
  getOverdueActionItems,
} from './action-items.service';
import { sendSuccess } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';

/**
 * POST /api/action-items
 */
export const createActionItemHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { body } = createActionItemSchema.parse({ body: req.body });
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const item = await createActionItem(body, req.user.userId);
    sendSuccess(res, req.traceId, item, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/action-items/:id/status
 */
export const updateStatusHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { body, params } = updateStatusSchema.parse({
      body: req.body,
      params: req.params,
    });
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const item = await updateActionItemStatus(params.id, body, req.user.userId);
    sendSuccess(res, req.traceId, item);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/action-items
 */
export const listActionItemsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { query } = listActionItemsSchema.parse({ query: req.query });
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const result = await listActionItems(query, req.user.userId);
    sendSuccess(res, req.traceId, result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/action-items/overdue
 */
export const getOverdueHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    const items = await getOverdueActionItems(req.user.userId);
    sendSuccess(res, req.traceId, { overdueItems: items, count: items.length });
  } catch (error) {
    next(error);
  }
};
