import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.requestId;
  
  if (err instanceof AppError) {
    logger.warn(`Operational Error: ${err.message}`, { requestId, statusCode: err.statusCode, details: err.details });
    return res.status(err.statusCode).json({
      success: false,
      data: null,
      error: {
        message: err.message,
        code: err.constructor.name,
        details: err.details,
      },
      meta: null,
    });
  }

  // Log unknown/unhandled errors with full stack trace
  logger.error(`Unhandled Exception: ${err.message}`, { requestId, stack: err.stack });

  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred on the server' 
    : err.message;

  return res.status(500).json({
    success: false,
    data: null,
    error: {
      message,
      code: 'INTERNAL_SERVER_ERROR',
      details: null,
    },
    meta: null,
  });
};
