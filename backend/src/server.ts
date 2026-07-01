import dotenv from 'dotenv';
// Load environment variables before any other imports to ensure config works
dotenv.config();

import app from './app';
import { logger } from './utils/logger';
import { prisma } from './config/prisma';

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('Database connection established successfully.');
    logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  } catch (error) {
    logger.error('Failed to connect to the database on start:', error);
    process.exit(1);
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down server gracefully.`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Database connection disconnected.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
