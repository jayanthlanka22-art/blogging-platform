import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/prisma';

describe('Comment Integration Tests', () => {
  let userToken: string;
  let userId: string;
  let postId: string;
  let otherUserToken: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.user.deleteMany({});

    // Setup authors/users
    const registerUserRes = await request(app).post('/api/v1/auth/register').send({
      email: 'user@example.com',
      username: 'commenter',
      password: 'Password123!',
    });
    userId = registerUserRes.body.data.id;

    const loginUserRes = await request(app).post('/api/v1/auth/login').send({
      emailOrUsername: 'user@example.com',
      password: 'Password123!',
    });
    userToken = loginUserRes.body.data.accessToken;

    const registerOtherRes = await request(app).post('/api/v1/auth/register').send({
      email: 'other@example.com',
      username: 'othercommenter',
      password: 'Password123!',
    });

    const loginOtherRes = await request(app).post('/api/v1/auth/login').send({
      emailOrUsername: 'other@example.com',
      password: 'Password123!',
    });
    otherUserToken = loginOtherRes.body.data.accessToken;

    // Create a post to comment on
    const post = await prisma.post.create({
      data: {
        title: 'Blogging Guide',
        slug: 'blogging-guide',
        content: 'This post is about comments.',
        excerpt: 'Excerpt',
        status: 'PUBLISHED',
        authorId: userId,
      },
    });
    postId = post.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/posts/:postId/comments', () => {
    it('should add a top-level comment successfully', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          content: 'This is my feedback on the post!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe('This is my feedback on the post!');
      expect(res.body.data.postId).toBe(postId);
      expect(res.body.data.authorId).toBe(userId);
      expect(res.body.data.parentId).toBeNull();
    });

    it('should add a nested reply to a comment successfully', async () => {
      // Create root comment first
      const rootComment = await prisma.comment.create({
        data: {
          content: 'Root comment',
          postId,
          authorId: userId,
        },
      });

      const res = await request(app)
        .post(`/api/v1/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          content: 'Replying to the root comment.',
          parentId: rootComment.id,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.parentId).toBe(rootComment.id);
      expect(res.body.data.content).toBe('Replying to the root comment.');
    });
  });

  describe('GET /api/v1/posts/:postId/comments', () => {
    it('should list threaded comments in a hierarchical structure', async () => {
      // Root Comment
      const c1 = await prisma.comment.create({
        data: { content: 'Root 1', postId, authorId: userId },
      });

      // Reply to Root
      const c1_1 = await prisma.comment.create({
        data: { content: 'Reply 1.1', postId, authorId: userId, parentId: c1.id },
      });

      // Reply to Reply (Recursive)
      const c1_1_1 = await prisma.comment.create({
        data: { content: 'Reply 1.1.1', postId, authorId: userId, parentId: c1_1.id },
      });

      const res = await request(app).get(`/api/v1/posts/${postId}/comments`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // We expect only root comments at the top level
      expect(res.body.data).toHaveLength(1);
      
      const root = res.body.data[0];
      expect(root.content).toBe('Root 1');
      expect(root.replies).toHaveLength(1);
      
      const reply = root.replies[0];
      expect(reply.content).toBe('Reply 1.1');
      expect(reply.replies).toHaveLength(1);
      
      const subReply = reply.replies[0];
      expect(subReply.content).toBe('Reply 1.1.1');
      expect(subReply.replies).toHaveLength(0);
    });
  });

  describe('DELETE /api/v1/comments/:id', () => {
    it('should soft delete comment and mask the content, but keep structure', async () => {
      const c1 = await prisma.comment.create({
        data: { content: 'Root Comment', postId, authorId: userId },
      });

      const c1_1 = await prisma.comment.create({
        data: { content: 'Reply to Root', postId, authorId: userId, parentId: c1.id },
      });

      const deleteRes = await request(app)
        .delete(`/api/v1/comments/${c1.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(deleteRes.status).toBe(204);

      // Verify the list endpoint shows masked content for c1, but c1_1 remains underneath
      const getRes = await request(app).get(`/api/v1/posts/${postId}/comments`);
      
      expect(getRes.status).toBe(200);
      expect(getRes.body.data).toHaveLength(1);
      
      const root = getRes.body.data[0];
      expect(root.content).toBe('[This comment has been deleted]');
      expect(root.replies).toHaveLength(1);
      expect(root.replies[0].content).toBe('Reply to Root');
    });
  });
});
