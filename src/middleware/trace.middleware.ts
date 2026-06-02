import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      traceId: string;
    }
  }
}

export const traceMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  req.traceId = uuidv4();
  next();
};
