import { Router } from 'express';
import authRouter from './auth.routes';
import postRouter from './post.routes';
import commentRouter from './comment.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/posts', postRouter);
router.use('/comments', commentRouter);

export default router;
