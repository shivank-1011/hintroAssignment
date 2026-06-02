import { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser } from './auth.service';
import { registerSchema, loginSchema } from './auth.schema';
import { sendSuccess } from '../../utils/response';

/**
 * POST /api/auth/register
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { body } = registerSchema.parse({ body: req.body });
    const result = await registerUser(body);
    sendSuccess(res, req.traceId, result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { body } = loginSchema.parse({ body: req.body });
    const result = await loginUser(body);
    sendSuccess(res, req.traceId, result, 200);
  } catch (error) {
    next(error);
  }
};
