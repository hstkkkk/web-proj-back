import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';
import { Application } from '@midwayjs/koa';

describe('User Controller', () => {
  let app: Application;

  beforeAll(async () => {
    // create app
    app = await createApp<Framework>();
  });

  afterAll(async () => {
    // close app
    await close(app);
  });

  describe('POST /api/users/register', () => {
    it('should register user successfully', async () => {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const uniqueUsername = `testuser_${timestamp}_${randomId}`;

      const userData = {
        username: uniqueUsername,
        password: 'password123',
        email: `testuser_${timestamp}_${randomId}@example.com`,
        phone: '13800138000',
        realName: 'Test User'
      };

      const result = await createHttpRequest(app)
        .post('/api/users/register')
        .send(userData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toHaveProperty('id');
      expect(result.body.data.username).toBe(userData.username);
      expect(result.body.data.email).toBe(userData.email);
      // 密码不应该在响应中返回
      expect(result.body.data).not.toHaveProperty('password');
    });

    it('should fail with invalid email', async () => {
      const userData = {
        username: 'testuser2',
        password: 'password123',
        email: 'invalid-email',
        phone: '13800138001',
        realName: 'Test User 2'
      };

      const result = await createHttpRequest(app)
        .post('/api/users/register')
        .send(userData);

      expect(result.status).toBe(422);
    });

    it('should fail with invalid phone number', async () => {
      const userData = {
        username: 'testuser3',
        password: 'password123',
        email: 'test3@example.com',
        phone: '123', // 无效手机号
        realName: 'Test User 3'
      };

      const result = await createHttpRequest(app)
        .post('/api/users/register')
        .send(userData);

      expect(result.status).toBe(422);
    });

    it('should fail with short password', async () => {
      const userData = {
        username: 'testuser4',
        password: '123', // 密码太短
        email: 'test4@example.com',
        phone: '13800138004',
        realName: 'Test User 4'
      };

      const result = await createHttpRequest(app)
        .post('/api/users/register')
        .send(userData);

      expect(result.status).toBe(422);
    });

    it('should fail with duplicate username', async () => {
      const userData = {
        username: 'testuser', // 已存在的用户名
        password: 'password123',
        email: 'test5@example.com',
        phone: '13800138005',
        realName: 'Test User 5'
      };

      const result = await createHttpRequest(app)
        .post('/api/users/register')
        .send(userData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toContain('用户名已存在');
    });
  });

  describe('POST /api/users/login', () => {
    beforeAll(async () => {
      // 确保有测试用户存在
      await createHttpRequest(app)
        .post('/api/users/register')
        .send({
          username: 'logintest',
          password: 'password123',
          email: 'logintest@example.com',
          phone: '13800138100',
          realName: 'Login Test User'
        });
    });

    it('should login successfully', async () => {
      const loginData = {
        username: 'logintest',
        password: 'password123'
      };

      const result = await createHttpRequest(app)
        .post('/api/users/login')
        .send(loginData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toHaveProperty('username');
      expect(result.body.data).toHaveProperty('token');
      expect(result.body.data.username).toBe(loginData.username);
    });

    it('should fail with wrong password', async () => {
      const loginData = {
        username: 'logintest',
        password: 'wrongpassword'
      };

      const result = await createHttpRequest(app)
        .post('/api/users/login')
        .send(loginData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toContain('用户名或密码错误');
    });

    it('should fail with non-existent user', async () => {
      const loginData = {
        username: 'nonexistent',
        password: 'password123'
      };

      const result = await createHttpRequest(app)
        .post('/api/users/login')
        .send(loginData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toContain('用户名或密码错误');
    });

    it('should fail with missing credentials', async () => {
      const result = await createHttpRequest(app)
        .post('/api/users/login')
        .send({});

      expect(result.status).toBe(422);
    });
  });

  describe('GET /api/users/profile', () => {
    let authToken: string;

    beforeAll(async () => {
      // 登录获取token
      const loginResult = await createHttpRequest(app)
        .post('/api/users/login')
        .send({
          username: 'logintest',
          password: 'password123'
        });
      
      authToken = loginResult.body.data.token;
    });

    it('should get user profile with valid token', async () => {
      const result = await createHttpRequest(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toHaveProperty('username', 'logintest');
      expect(result.body.data).not.toHaveProperty('password');
    });

    it('should fail without token', async () => {
      const result = await createHttpRequest(app)
        .get('/api/users/profile');

      expect(result.status).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const result = await createHttpRequest(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(result.status).toBe(401);
    });
  });
});
