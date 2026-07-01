import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 10000 : 20, // Increase limit for test suites to prevent test rate limiting
  message: {
    success: false,
    data: null,
    error: {
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
      code: 'TOO_MANY_REQUESTS',
      details: null,
    },
    meta: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
