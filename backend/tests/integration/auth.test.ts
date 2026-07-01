import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/config/prisma';

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    // Clean tables before each test
    await prisma.refreshToken.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'Password123!',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe(testUser.email);
      expect(res.body.data.username).toBe(testUser.username);
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('should reject registration with duplicate email', async () => {
      await request(app).post('/api/v1/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testUser.email,
          username: 'othername',
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('email already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully and set refresh cookie', async () => {
      // Register first
      await request(app).post('/api/v1/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe(testUser.email);

      // Verify cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refreshToken=');
      expect(cookies[0]).toContain('HttpOnly');
    });

    it('should reject invalid password', async () => {
      await request(app).post('/api/v1/auth/register').send(testUser);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: testUser.email,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should rotate token successfully', async () => {
      await request(app).post('/api/v1/auth/register').send(testUser);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: testUser.email,
          password: testUser.password,
        });

      const cookies = loginRes.headers['set-cookie'];
      const refreshCookie = cookies[0].split(';')[0]; // refreshToken=xxxx

      // Wait a moment
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [refreshCookie]);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data).toHaveProperty('accessToken');
    });

    it('should revoke all tokens if a refresh token is reused', async () => {
      await request(app).post('/api/v1/auth/register').send(testUser);

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          emailOrUsername: testUser.email,
          password: testUser.password,
        });

      const cookies = loginRes.headers['set-cookie'];
      const refreshCookie = cookies[0].split(';')[0];

      // First refresh (succeeds, old token is revoked)
      const res1 = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [refreshCookie]);

      expect(res1.status).toBe(200);

      // Second refresh using the same old token (fails, and should trigger breach detection)
      const res2 = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [refreshCookie]);

      expect(res2.status).toBe(401);
      expect(res2.body.error.message).toContain('Compromised refresh token reused');

      // Verify that all active tokens are revoked for the user
      const user = await prisma.user.findUnique({
        where: { email: testUser.email },
        include: { refreshTokens: true },
      });

      const activeTokensCount = user?.refreshTokens.filter(t => !t.revoked).length;
      expect(activeTokensCount).toBe(0);
    });
  });
});
