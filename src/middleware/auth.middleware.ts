import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';

interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string };
    }
  }
}

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authorization token required', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];
  if (!token) throw new AppError('Authorization token required', 401, 'UNAUTHORIZED');

  try {
    const secret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) throw new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
    if (error instanceof jwt.JsonWebTokenError) throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
    throw new AppError('Authentication failed', 401, 'UNAUTHORIZED');
  }
};
