import { z } from 'zod';
import { PostStatus } from './enums';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
});

export const LoginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const CreatePostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().max(300, 'Excerpt cannot exceed 300 characters').optional(),
  coverImage: z.string().url('Invalid cover image URL').or(z.string().length(0)).optional().nullable(),
  status: z.nativeEnum(PostStatus).optional(),
  tags: z.array(z.string().min(1).max(20)).optional(),
});

export const UpdatePostSchema = CreatePostSchema.partial();

export const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty').max(1000, 'Comment cannot exceed 1000 characters'),
  parentId: z.string().uuid('Invalid parent comment ID').optional().nullable(),
});

export const UpdateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty').max(1000, 'Comment cannot exceed 1000 characters'),
});
