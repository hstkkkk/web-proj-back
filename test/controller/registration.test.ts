import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';
import { Application } from '@midwayjs/koa';

describe('Registration Controller', () => {
  let app: Application;
  let authToken: string;
  let testUserId: number;
  let testActivityId: number;

  beforeAll(async () => {
    // create app
    app = await createApp<Framework>();
    
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const uniqueUsername = `regtest_${timestamp}_${randomId}`;
    
    // 创建测试用户
    const registerResult = await createHttpRequest(app)
      .post('/api/users/register')
      .send({
        username: uniqueUsername,
        password: 'password123',
        email: `regtest_${timestamp}_${randomId}@example.com`,
        phone: '13800138900',
        realName: 'Registration Test User'
      });
    
    console.log('Registration result:', registerResult.body); // 用于调试
    testUserId = registerResult.body.data?.id;
    
    // 登录获取token
    const loginResult = await createHttpRequest(app)
      .post('/api/users/login')
      .send({
        username: uniqueUsername,
        password: 'password123'
      });
    
    authToken = loginResult.body.data.token;
    
    // 创建测试活动
    const activityResult = await createHttpRequest(app)
      .post('/api/activities')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: '注册测试活动',
        description: '用于测试注册功能的活动',
        category: 'football',
        location: '测试场地',
        startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(),
        maxParticipants: 10,
        price: 50.0
      });
    
    testActivityId = activityResult.body.data.id;
  });

  afterAll(async () => {
    await close(app);
  });

  describe('POST /api/registrations', () => {
    it('should register for activity successfully', async () => {
      const registrationData = {
        activityId: testActivityId,
        notes: '期待参加这个活动'
      };

      const result = await createHttpRequest(app)
        .post('/api/registrations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(registrationData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toHaveProperty('id');
      expect(result.body.data.activityId).toBe(testActivityId);
      expect(result.body.data.userId).toBe(testUserId);
      expect(result.body.data.notes).toBe(registrationData.notes);
    });

    it('should fail without authentication', async () => {
      const registrationData = {
        activityId: testActivityId,
        notes: '未授权注册'
      };

      const result = await createHttpRequest(app)
        .post('/api/registrations')
        .send(registrationData);

      expect(result.status).toBe(401);
    });

    it('should fail with non-existent activity', async () => {
      const registrationData = {
        activityId: 99999,
        notes: '不存在的活动'
      };

      const result = await createHttpRequest(app)
        .post('/api/registrations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(registrationData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toContain('活动不存在');
    });

    it('should fail for duplicate registration', async () => {
      const registrationData = {
        activityId: testActivityId,
        notes: '重复注册'
      };

      const result = await createHttpRequest(app)
        .post('/api/registrations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(registrationData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toContain('已经报名');
    });
  });

  describe('GET /api/registrations/my', () => {
    it('should get user registrations', async () => {
      const result = await createHttpRequest(app)
        .get('/api/registrations/my')
        .set('Authorization', `Bearer ${authToken}`);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(Array.isArray(result.body.data)).toBe(true);
      expect(result.body.data.length).toBeGreaterThan(0);
      
      // 验证包含活动信息
      const registration = result.body.data[0];
      expect(registration).toHaveProperty('activity');
      expect(registration.activity).toHaveProperty('title');
    });

    it('should fail without authentication', async () => {
      const result = await createHttpRequest(app)
        .get('/api/registrations/my');

      expect(result.status).toBe(401);
    });
  });

  describe('GET /api/activities/:id/registrations', () => {
    it('should get activity registrations for organizer', async () => {
      const result = await createHttpRequest(app)
        .get(`/api/activities/${testActivityId}/registrations`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(Array.isArray(result.body.data)).toBe(true);
      expect(result.body.data.length).toBeGreaterThan(0);
      
      // 验证包含用户信息
      const registration = result.body.data[0];
      expect(registration).toHaveProperty('user');
      expect(registration.user).toHaveProperty('username');
    });

    it('should fail for non-organizer', async () => {
      // 创建另一个用�?
      await createHttpRequest(app)
        .post('/api/users/register')
        .send({
          username: 'nonorganizer',
          password: 'password123',
          email: 'nonorganizer@example.com',
          phone: '13800139000',
          realName: 'Non Organizer'
        });

      const loginResult = await createHttpRequest(app)
        .post('/api/users/login')
        .send({
          username: 'nonorganizer',
          password: 'password123'
        });

      const nonOrganizerToken = loginResult.body.data.token;

      const result = await createHttpRequest(app)
        .get(`/api/activities/${testActivityId}/registrations`)
        .set('Authorization', `Bearer ${nonOrganizerToken}`);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toContain('权限不足');
    });
  });

  describe('DELETE /api/registrations/:id', () => {
    let registrationId: number;

    beforeAll(async () => {
      // 创建另一个活动用于取消注册测�?
      const activityResult = await createHttpRequest(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '取消注册测试活动',
          description: '用于测试取消注册功能',
          category: 'basketball',
          location: '测试篮球场',
          startTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 73 * 60 * 60 * 1000).toISOString(),
          maxParticipants: 5,
          price: 30.0
        });

      const cancelActivityId = activityResult.body.data.id;

      // 注册活动
      const registrationResult = await createHttpRequest(app)
        .post('/api/registrations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          activityId: cancelActivityId,
          notes: '准备取消的注册'
        });

      registrationId = registrationResult.body.data.id;
    });

    it('should cancel registration successfully', async () => {
      const result = await createHttpRequest(app)
        .delete(`/api/registrations/${registrationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);

      // 验证注册已被取消
      const myRegistrationsResult = await createHttpRequest(app)
        .get('/api/registrations/my')
        .set('Authorization', `Bearer ${authToken}`);

      const cancelledRegistration = myRegistrationsResult.body.data
        .find((reg: any) => reg.id === registrationId);
      expect(cancelledRegistration).toBeUndefined();
    });

    it('should fail without authentication', async () => {
      const result = await createHttpRequest(app)
        .delete(`/api/registrations/${registrationId}`);

      expect(result.status).toBe(401);
    });
  });

  describe('Activity capacity management', () => {
    let limitedActivityId: number;

    beforeAll(async () => {
      // 创建一个只�?个名额的活动
      const activityResult = await createHttpRequest(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '限额测试活动',
          description: '只有1个名额的活动',
          category: 'running',
          location: '测试跑道',
          startTime: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 97 * 60 * 60 * 1000).toISOString(),
          maxParticipants: 1,
          price: 0
        });

      limitedActivityId = activityResult.body.data.id;
    });

    it('should fail registration when activity is full', async () => {
      // 先让第一个用户注�?
      await createHttpRequest(app)
        .post('/api/registrations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          activityId: limitedActivityId,
          notes: '第一个注册'
        });

      // 创建第二个用�?
      await createHttpRequest(app)
        .post('/api/users/register')
        .send({
          username: 'seconduser',
          password: 'password123',
          email: 'seconduser@example.com',
          phone: '13800139100',
          realName: 'Second User'
        });

      const loginResult = await createHttpRequest(app)
        .post('/api/users/login')
        .send({
          username: 'seconduser',
          password: 'password123'
        });

      const secondUserToken = loginResult.body.data.token;

      // 第二个用户尝试注册，应该失败
      const result = await createHttpRequest(app)
        .post('/api/registrations')
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          activityId: limitedActivityId,
          notes: '第二个注册，应该失败'
        });

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toContain('活动已满员');
    });
  });
});
