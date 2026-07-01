import { Request, Response } from 'express';
import { CommentService } from '../services/comment.service';
import { CreateCommentSchema, UpdateCommentSchema } from '../utils/validation';
import { ValidationError, BadRequestError, ForbiddenError } from '../utils/errors';

export class CommentController {
  public static create = async (req: Request, res: Response) => {
    const { postId } = req.params;
    if (!postId) {
      throw new BadRequestError('Post ID is required');
    }

    const parseResult = CreateCommentSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.format());
    }

    if (!req.user) {
      throw new ForbiddenError('User context missing');
    }

    const comment = await CommentService.create({
      content: parseResult.data.content,
      postId,
      authorId: req.user.userId,
      parentId: parseResult.data.parentId || undefined,
    });

    res.status(201).json({
      success: true,
      data: comment,
      error: null,
      meta: null,
    });
  };

  public static list = async (req: Request, res: Response) => {
    const { postId } = req.params;
    if (!postId) {
      throw new BadRequestError('Post ID is required');
    }

    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    const result = await CommentService.listForPost(postId, { page, limit });

    res.status(200).json({
      success: true,
      data: result.comments,
      error: null,
      meta: result.meta,
    });
  };

  public static update = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError('Comment ID is required');
    }

    const parseResult = UpdateCommentSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new ValidationError('Validation failed', parseResult.error.format());
    }

    if (!req.user) {
      throw new ForbiddenError('User context missing');
    }

    const comment = await CommentService.update(id, parseResult.data.content, {
      userId: req.user.userId,
      role: req.user.role,
    });

    res.status(200).json({
      success: true,
      data: comment,
      error: null,
      meta: null,
    });
  };

  public static delete = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError('Comment ID is required');
    }

    if (!req.user) {
      throw new ForbiddenError('User context missing');
    }

    await CommentService.delete(id, {
      userId: req.user.userId,
      role: req.user.role,
    });

    res.status(204).send();
  };
}
