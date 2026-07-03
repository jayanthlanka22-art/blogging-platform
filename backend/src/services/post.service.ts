import slugify from 'slugify';
import { prisma } from '../config/prisma';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import { PostStatus } from '../utils/enums';

export class PostService {
  private static async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.post.findUnique({
        where: { slug },
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  public static async create(data: {
    title: string;
    content: string;
    excerpt?: string;
    coverImage?: string | null;
    status?: PostStatus;
    tags?: string[];
    authorId: string;
  }) {
    const slug = await this.generateUniqueSlug(data.title);
    
    // Auto-generate excerpt if not provided
    const excerpt = data.excerpt || data.content.substring(0, 150).replace(/[#*_`]/g, '') + '...';

    // Handle tag connections
    const tagConnectOrCreate = data.tags
      ? data.tags.map((tag) => ({
          where: { name: tag.toLowerCase() },
          create: { name: tag.toLowerCase() },
        }))
      : [];

    const post = await prisma.post.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt,
        coverImage: data.coverImage,
        status: data.status || PostStatus.DRAFT,
        authorId: data.authorId,
        tags: {
          connectOrCreate: tagConnectOrCreate,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        tags: true,
      },
    });

    return post;
  }

  public static async list(options: {
    page?: number;
    limit?: number;
    tag?: string;
    authorId?: string;
    status?: PostStatus;
    sortBy?: 'newest' | 'oldest' | 'most-commented';
    currentUserId?: string;
    currentUserRole?: string;
    search?: string;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 10);
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    const andConditions: any[] = [];

    // Filter by tag
    if (options.tag) {
      andConditions.push({
        tags: {
          some: {
            name: options.tag.toLowerCase(),
          },
        },
      });
    }

    // Filter by author
    if (options.authorId) {
      andConditions.push({ authorId: options.authorId });
    }

    // Status filtering rules:
    // 1. If looking for drafts, or status parameter is draft, only allow if the filterer is the author or admin.
    // 2. By default, public listing only returns PUBLISHED posts.
    if (options.status) {
      if (options.status === PostStatus.DRAFT) {
        if (!options.currentUserId) {
          throw new ForbiddenError('Unauthorized to view draft posts');
        }
        if (options.currentUserRole !== 'ADMIN') {
          // If not admin, restrict drafts to only the requesting user's posts
          andConditions.push({
            status: PostStatus.DRAFT,
            authorId: options.currentUserId,
          });
        } else {
          andConditions.push({
            status: PostStatus.DRAFT,
          });
        }
      } else {
        andConditions.push({
          status: PostStatus.PUBLISHED,
        });
      }
    } else {
      // No status parameter.
      // If client is ADMIN: let them see both.
      // If client is regular logged-in user: let them see all published, plus their own drafts.
      // If client is guest: see only published.
      if (options.currentUserRole === 'ADMIN') {
        // Can see all statuses
      } else if (options.currentUserId) {
        andConditions.push({
          OR: [
            { status: PostStatus.PUBLISHED },
            { status: PostStatus.DRAFT, authorId: options.currentUserId },
          ],
        });
      } else {
        andConditions.push({
          status: PostStatus.PUBLISHED,
        });
      }
    }

    // Filter by search term
    if (options.search) {
      const isProduction = process.env.NODE_ENV === 'production';
      const searchCondition = isProduction
        ? [
            { title: { contains: options.search, mode: 'insensitive' } },
            { content: { contains: options.search, mode: 'insensitive' } },
            { excerpt: { contains: options.search, mode: 'insensitive' } },
          ]
        : [
            { title: { contains: options.search } },
            { content: { contains: options.search } },
            { excerpt: { contains: options.search } },
          ];
      andConditions.push({
        OR: searchCondition,
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Determine sorting
    let orderBy: any = { createdAt: 'desc' }; // default 'newest'
    if (options.sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (options.sortBy === 'most-commented') {
      // Prisma doesn't natively support sorting by relation count directly in standard orderBy,
      // but we can query comments length. However, we can order by comment count using aggregate
      // or we can sort after retrieval, or we can use Prisma's aggregate features.
      // In Prisma: orderBy: { comments: { _count: 'desc' } } is supported in newer versions.
      orderBy = {
        comments: {
          _count: 'desc',
        },
      };
    }

    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
          tags: true,
          _count: {
            select: { comments: { where: { isDeleted: false } } },
          },
        },
      }),
    ]);

    return {
      posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async getBySlug(slug: string, options: { currentUserId?: string; currentUserRole?: string }) {
    const post = await prisma.post.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug }
        ],
        isDeleted: false,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        tags: true,
      },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // Permission check for drafts
    if (post.status === PostStatus.DRAFT) {
      if (!options.currentUserId) {
        throw new ForbiddenError('Unauthorized to view draft posts');
      }
      if (options.currentUserRole !== 'ADMIN' && post.authorId !== options.currentUserId) {
        throw new ForbiddenError('Unauthorized to view this draft post');
      }
    }

    return post;
  }

  public static async update(
    id: string,
    data: {
      title?: string;
      content?: string;
      excerpt?: string;
      coverImage?: string | null;
      status?: PostStatus;
      tags?: string[];
    },
    userContext: { userId: string; role: string }
  ) {
    const post = await prisma.post.findFirst({
      where: { id, isDeleted: false },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // Permission check: only author or admin
    if (post.authorId !== userContext.userId && userContext.role !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to edit this post');
    }

    const updateData: any = {};
    if (data.title) {
      updateData.title = data.title;
      // Regenerate slug if title changes
      updateData.slug = await this.generateUniqueSlug(data.title);
    }
    if (data.content) {
      updateData.content = data.content;
      if (!data.excerpt) {
        updateData.excerpt = data.content.substring(0, 150).replace(/[#*_`]/g, '') + '...';
      }
    }
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.status) updateData.status = data.status;

    // Handle tag updates
    if (data.tags) {
      // Disconnect existing tags
      await prisma.post.update({
        where: { id },
        data: { tags: { set: [] } },
      });

      updateData.tags = {
        connectOrCreate: data.tags.map((tag) => ({
          where: { name: tag.toLowerCase() },
          create: { name: tag.toLowerCase() },
        })),
      };
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
        tags: true,
      },
    });

    return updatedPost;
  }

  public static async delete(id: string, userContext: { userId: string; role: string }) {
    const post = await prisma.post.findFirst({
      where: { id, isDeleted: false },
    });

    if (!post) {
      throw new NotFoundError('Post not found');
    }

    // Permission check
    if (post.authorId !== userContext.userId && userContext.role !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to delete this post');
    }

    // Soft delete
    await prisma.post.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}
