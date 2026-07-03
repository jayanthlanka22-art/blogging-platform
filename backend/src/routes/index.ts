import { Router, Request, Response } from 'express';
import authRouter from './auth.routes';
import postRouter from './post.routes';
import commentRouter from './comment.routes';
import { prisma } from '../config/prisma';
import { catchAsync } from '../utils/catch-async';

const router = Router();

router.use('/auth', authRouter);
router.use('/posts', postRouter);
router.use('/comments', commentRouter);

// Fetch all tags dynamically
router.get(
  '/tags',
  catchAsync(async (req: Request, res: Response) => {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json({
      success: true,
      data: tags,
      error: null,
      meta: null,
    });
  })
);

export default router;
