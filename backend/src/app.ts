import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { errorHandler } from './middleware/error.middleware';
import apiRouter from './routes';

const app = express();

// Secure headers
app.use(helmet());

// CORS configuration supporting credentials (cookies)
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  })
);

// Body parsers
app.use(express.json());
app.use(cookieParser());

// Custom transaction/request tracing
app.use(requestIdMiddleware);
app.use(requestLogger);

// API router
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
