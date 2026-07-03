import { Request, Response } from 'express';
import { PostService } from '../services/post.service';
import { CreatePostSchema, UpdatePostSchema } from '../utils/validation';
import { ValidationError, BadRequestError, ForbiddenError } from '../utils/errors';
import { PostStatus } from '../utils/enums';

export class PostController {
  public static create = async (req: Request, res: Response) => {
    const parseResult = CreatePostSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.format());
    }

    if (!req.user) {
      throw new ForbiddenError('User context missing');
    }

    const post = await PostService.create({
      ...parseResult.data,
      authorId: req.user.userId,
    });

    res.status(201).json({
      success: true,
      data: post,
      error: null,
      meta: null,
    });
  };

  public static list = async (req: Request, res: Response) => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const tag = req.query.tag as string | undefined;
    const authorId = req.query.authorId as string | undefined;
    const status = req.query.status as PostStatus | undefined;
    const sortBy = req.query.sortBy as 'newest' | 'oldest' | 'most-commented' | undefined;
    const search = req.query.search as string | undefined;

    const result = await PostService.list({
      page,
      limit,
      tag,
      authorId,
      status,
      sortBy,
      search,
      currentUserId: req.user?.userId,
      currentUserRole: req.user?.role,
    });

    res.status(200).json({
      success: true,
      data: result.posts,
      error: null,
      meta: result.meta,
    });
  };

  public static getBySlug = async (req: Request, res: Response) => {
    const { slug } = req.params;
    if (!slug) {
      throw new BadRequestError('Slug is required');
    }

    const post = await PostService.getBySlug(slug, {
      currentUserId: req.user?.userId,
      currentUserRole: req.user?.role,
    });

    res.status(200).json({
      success: true,
      data: post,
      error: null,
      meta: null,
    });
  };

  public static update = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError('Post ID is required');
    }

    const parseResult = UpdatePostSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.format());
    }

    if (!req.user) {
      throw new ForbiddenError('User context missing');
    }

    const post = await PostService.update(id, parseResult.data, {
      userId: req.user.userId,
      role: req.user.role,
    });

    res.status(200).json({
      success: true,
      data: post,
      error: null,
      meta: null,
    });
  };

  public static delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError('Post ID is required');
    }

    if (!req.user) {
      throw new ForbiddenError('User context missing');
    }

    await PostService.delete(id, {
      userId: req.user.userId,
      role: req.user.role,
    });

    res.status(204).send();
  };
}
