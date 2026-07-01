import { prisma } from '../config/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';

export interface CommentTreeNode {
  id: string;
  content: string;
  isDeleted: boolean;
  authorId: string;
  postId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string;
  };
  replies: CommentTreeNode[];
}

export class CommentService {
  public static async create(data: {
    content: string;
    postId: string;
    authorId: string;
    parentId?: string;
  }) {
    // Verify post exists
    const post = await prisma.post.findFirst({
      where: { id: data.postId, isDeleted: false },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // Verify parent comment if provided
    if (data.parentId) {
      const parentComment = await prisma.comment.findFirst({
        where: { id: data.parentId, isDeleted: false },
      });

      if (!parentComment) {
        throw new NotFoundError('Parent comment not found');
      }

      if (parentComment.postId !== data.postId) {
        throw new BadRequestError('Parent comment does not belong to this post');
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        postId: data.postId,
        authorId: data.authorId,
        parentId: data.parentId || null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return comment;
  }

  public static async listForPost(postId: string, options: { page?: number; limit?: number }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 10);
    const skip = (page - 1) * limit;

    // Verify post exists
    const post = await prisma.post.findFirst({
      where: { id: postId, isDeleted: false },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // To prevent N+1 queries, we fetch all comments for the post in one query.
    // In production, we could optimize this, but for threaded comments, fetching the flat list
    // and building the tree in-memory is the standard performant approach.
    const allComments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Build the map of comments for parent-child stitching
    const commentMap = new Map<string, CommentTreeNode>();
    const rootComments: CommentTreeNode[] = [];

    // Initialize all comments with an empty replies array
    allComments.forEach((comment) => {
      // If deleted, replace content
      const content = comment.isDeleted ? '[This comment has been deleted]' : comment.content;
      commentMap.set(comment.id, {
        ...comment,
        content,
        replies: [],
      });
    });

    // Stitch replies together
    allComments.forEach((comment) => {
      const node = commentMap.get(comment.id)!;
      if (comment.parentId) {
        const parentNode = commentMap.get(comment.parentId);
        if (parentNode) {
          parentNode.replies.push(node);
        } else {
          // If parent is missing or deleted and not in map, treat as root
          rootComments.push(node);
        }
      } else {
        rootComments.push(node);
      }
    });

    // Paginate root comments
    const total = rootComments.length;
    const paginatedRootComments = rootComments.slice(skip, skip + limit);

    return {
      comments: paginatedRootComments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async update(id: string, content: string, userContext: { userId: string; role: string }) {
    const comment = await prisma.comment.findFirst({
      where: { id, isDeleted: false },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // Permission check: only author or admin
    if (comment.authorId !== userContext.userId && userContext.role !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to edit this comment');
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    return updatedComment;
  }

  public static async delete(id: string, userContext: { userId: string; role: string }) {
    const comment = await prisma.comment.findFirst({
      where: { id, isDeleted: false },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // Permission check
    if (comment.authorId !== userContext.userId && userContext.role !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to delete this comment');
    }

    // Soft delete so replies remain reachable
    await prisma.comment.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
