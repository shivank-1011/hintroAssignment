import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorMiddleware = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  const traceId = req.traceId || 'unknown';

  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    logger.warn({ traceId, error: messages }, 'Validation error');
    sendError(res, traceId, 400, 'VALIDATION_ERROR', messages);
    return;
  }

  if (err instanceof AppError) {
    logger.warn({ traceId, code: err.code, error: err.message }, 'App error');
    sendError(res, traceId, err.statusCode, err.code, err.message);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') { sendError(res, traceId, 409, 'CONFLICT', 'Record already exists'); return; }
    if (err.code === 'P2025') { sendError(res, traceId, 404, 'NOT_FOUND', 'Record not found'); return; }
    logger.error({ traceId, prismaCode: err.code, error: err.message }, 'Prisma error');
    sendError(res, traceId, 400, 'DATABASE_ERROR', 'Database operation failed');
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error({ traceId, error: err.message }, 'Prisma validation error');
    sendError(res, traceId, 400, 'DATABASE_VALIDATION_ERROR', 'Invalid data provided');
    return;
  }

  logger.error({ traceId, error: err.message, stack: err.stack }, 'Unhandled error');
  sendError(res, traceId, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
};
