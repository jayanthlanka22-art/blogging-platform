import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { catchAsync } from '../utils/catch-async';

const router = Router();

router.put('/:id', requireAuth, catchAsync(CommentController.update));
router.delete('/:id', requireAuth, catchAsync(CommentController.delete));

export default router;
