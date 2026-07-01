import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/prisma';

describe('Post Integration Tests', () => {
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let otherUserToken: string;

  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.user.deleteMany({});

    // Setup users
    const registerUserRes = await request(app).post('/api/v1/auth/register').send({
      email: 'user@example.com',
      username: 'normaluser',
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
      username: 'otheruser',
      password: 'Password123!',
    });

    const loginOtherRes = await request(app).post('/api/v1/auth/login').send({
      emailOrUsername: 'other@example.com',
      password: 'Password123!',
    });
    otherUserToken = loginOtherRes.body.data.accessToken;

    // Register admin directly in DB to bypass role restriction
    const bcrypt = require('bcrypt');
    const adminHash = await bcrypt.hash('Password123!', 12);
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        username: 'adminuser',
        passwordHash: adminHash,
        role: 'ADMIN',
      },
    });

    const loginAdminRes = await request(app).post('/api/v1/auth/login').send({
      emailOrUsername: 'admin@example.com',
      password: 'Password123!',
    });
    adminToken = loginAdminRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/posts', () => {
    it('should create a new post successfully as authenticated user', async () => {
      const postData = {
        title: 'My First Blog Post',
        content: 'This is the body content of my blog post.',
        status: 'PUBLISHED',
        tags: ['react', 'testing'],
      };

      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(postData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(postData.title);
      expect(res.body.data.slug).toBe('my-first-blog-post');
      expect(res.body.data.authorId).toBe(userId);
      expect(res.body.data.tags).toHaveLength(2);
    });

    it('should prevent guest from creating a post', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .send({
          title: 'Guest Title',
          content: 'Guest Content',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/posts/:id', () => {
    it('should update post successfully if user is the author', async () => {
      // Create post
      const createRes = await prisma.post.create({
        data: {
          title: 'Initial Title',
          slug: 'initial-title',
          content: 'Initial Content',
          excerpt: 'Initial Excerpt',
          authorId: userId,
        },
      });

      const updateRes = await request(app)
        .put(`/api/v1/posts/${createRes.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Title',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.title).toBe('Updated Title');
      expect(updateRes.body.data.slug).toBe('updated-title');
    });

    it('should prevent updating post if user is not the author', async () => {
      const createRes = await prisma.post.create({
        data: {
          title: 'Initial Title',
          slug: 'initial-title',
          content: 'Initial Content',
          excerpt: 'Initial Excerpt',
          authorId: userId,
        },
      });

      const updateRes = await request(app)
        .put(`/api/v1/posts/${createRes.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          title: 'Hacked Title',
        });

      expect(updateRes.status).toBe(403);
    });

    it('should allow admin to update any post', async () => {
      const createRes = await prisma.post.create({
        data: {
          title: 'Initial Title',
          slug: 'initial-title',
          content: 'Initial Content',
          excerpt: 'Initial Excerpt',
          authorId: userId,
        },
      });

      const updateRes = await request(app)
        .put(`/api/v1/posts/${createRes.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Edited',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.title).toBe('Admin Edited');
    });
  });

  describe('DELETE /api/v1/posts/:id', () => {
    it('should soft delete post successfully', async () => {
      const createRes = await prisma.post.create({
        data: {
          title: 'Title to Delete',
          slug: 'title-to-delete',
          content: 'Content',
          excerpt: 'Excerpt',
          authorId: userId,
        },
      });

      const deleteRes = await request(app)
        .delete(`/api/v1/posts/${createRes.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(deleteRes.status).toBe(204);

      // Verify DB contains it but is marked isDeleted: true
      const post = await prisma.post.findUnique({
        where: { id: createRes.id },
      });
      expect(post?.isDeleted).toBe(true);
    });
  });
});
