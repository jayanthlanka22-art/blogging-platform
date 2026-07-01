import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.header('x-request-id') || uuidv4();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
