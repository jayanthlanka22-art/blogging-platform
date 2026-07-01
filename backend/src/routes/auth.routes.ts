import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/rate-limiter.middleware';
import { catchAsync } from '../utils/catch-async';

const router = Router();

router.post('/register', authRateLimiter, catchAsync(AuthController.register));
router.post('/login', authRateLimiter, catchAsync(AuthController.login));
router.post('/refresh', catchAsync(AuthController.refresh));
router.post('/logout', catchAsync(AuthController.logout));

export default router;
