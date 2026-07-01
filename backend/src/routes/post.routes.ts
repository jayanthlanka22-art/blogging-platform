import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { CommentController } from '../controllers/comment.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { catchAsync } from '../utils/catch-async';

const router = Router();

router.post('/', requireAuth, catchAsync(PostController.create));
router.get('/', optionalAuth, catchAsync(PostController.list));
router.get('/:slug', optionalAuth, catchAsync(PostController.getBySlug));
router.put('/:id', requireAuth, catchAsync(PostController.update));
router.delete('/:id', requireAuth, catchAsync(PostController.delete));

// Nested comments routes
router.post('/:postId/comments', requireAuth, catchAsync(CommentController.create));
router.get('/:postId/comments', catchAsync(CommentController.list));

export default router;
