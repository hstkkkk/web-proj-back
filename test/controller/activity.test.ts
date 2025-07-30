import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';
import { Application } from '@midwayjs/koa';

describe('Activity Controller', () => {
  let app: Application;
  let authToken: string;
  let testUserId: number;

  beforeAll(async () => {
    // create app
    app = await createApp<Framework>();
    
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const uniqueUsername = `activitytest_${timestamp}_${randomId}`;
    
    // 创建测试用户并获取token
    const registerResult = await createHttpRequest(app)
      .post('/api/users/register')
      .send({
        username: uniqueUsername,
        password: 'password123',
        email: `activitytest_${timestamp}_${randomId}@example.com`,
        phone: '13800138200',
        realName: 'Activity Test User'
      });
    
    testUserId = registerResult.body.data.id;
    
    const loginResult = await createHttpRequest(app)
      .post('/api/users/login')
      .send({
        username: uniqueUsername,
        password: 'password123'
      });
    
    authToken = loginResult.body.data.token;
  });

  afterAll(async () => {
    // close app
    await close(app);
  });

  describe('POST /api/activities', () => {
    it('should create activity successfully', async () => {
      const activityData = {
        title: '测试活动',
        description: '这是一个测试活动',
        category: 'football',
        location: '北京体育场',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),   // 明天+1小时
        maxParticipants: 20,
        price: 50.0,
        imageUrl: 'https://example.com/image.jpg'
      };

      const result = await createHttpRequest(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(activityData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toHaveProperty('id');
      expect(result.body.data.title).toBe(activityData.title);
      expect(result.body.data.creatorId).toBe(testUserId);
    });

    it('should fail without authentication', async () => {
      const activityData = {
        title: '未授权测试活动',
        description: '这个应该失败',
        category: 'football',
        location: '北京体育场',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        maxParticipants: 20,
        price: 50.0
      };

      const result = await createHttpRequest(app)
        .post('/api/activities')
        .send(activityData);

      expect(result.status).toBe(401);
    });

    it('should fail with invalid data', async () => {
      const activityData = {
        title: '', // 空标题应该失败
        description: '测试描述',
        category: 'invalid-type', // 无效类型
        location: '',
        startTime: 'invalid-date', // 无效日期
        maxParticipants: -1, // 负数
        price: -10 // 负费用
      };

      const result = await createHttpRequest(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(activityData);

      expect(result.status).toBe(422);
    });
  });

  describe('GET /api/activities', () => {
    beforeAll(async () => {
      // 创建测试活动
      await createHttpRequest(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '测试活动列表',
          description: '用于测试活动列表的活动',
          category: 'basketball',
          location: '上海体育馆',
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(),
          maxParticipants: 10,
          price: 30.0
        });
    });

    it('should get activities list', async () => {
      const result = await createHttpRequest(app)
        .get('/api/activities');

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(Array.isArray(result.body.data)).toBe(true);
      expect(result.body.data.length).toBeGreaterThan(0);
    });

    it('should filter activities by type', async () => {
      const result = await createHttpRequest(app)
        .get('/api/activities')
        .query({ category: 'basketball' });

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(Array.isArray(result.body.data)).toBe(true);
      // 所有返回的活动应该都是basketball类型
      result.body.data.forEach((activity: any) => {
        expect(activity.category).toBe('basketball');
      });
    });

    it('should paginate activities', async () => {
      const result = await createHttpRequest(app)
        .get('/api/activities')
        .query({ page: 1, limit: 1 });

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(Array.isArray(result.body.data)).toBe(true);
      expect(result.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/activities/:id', () => {
    let testActivityId: number;

    beforeAll(async () => {
      const createResult = await createHttpRequest(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '测试活动详情',
          description: '用于测试活动详情的活动',
          category: 'tennis',
          location: '广州网球场',
          startTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 73 * 60 * 60 * 1000).toISOString(),
          maxParticipants: 4,
          price: 100.0
        });
      
      testActivityId = createResult.body.data.id;
    });

    it('should get activity detail', async () => {
      const result = await createHttpRequest(app)
        .get(`/api/activities/${testActivityId}`);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data).toHaveProperty('id', testActivityId);
      expect(result.body.data).toHaveProperty('title', '测试活动详情');
      expect(result.body.data).toHaveProperty('creator');
    });

    it('should return 404 for non-existent activity', async () => {
      const result = await createHttpRequest(app)
        .get('/api/activities/99999');

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toContain('活动不存在');
    });
  });

  describe('PUT /api/activities/:id', () => {
    let testActivityId: number;

    beforeAll(async () => {
      const createResult = await createHttpRequest(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '待更新活动',
          description: '这个活动将被更新',
          category: 'swimming',
          location: '深圳游泳馆',
          startTime: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 97 * 60 * 60 * 1000).toISOString(),
          maxParticipants: 15,
          price: 25.0
        });
      
      testActivityId = createResult.body.data.id;
    });

    it('should update activity successfully', async () => {
      const updateData = {
        title: '已更新活动',
        description: '活动描述已更新',
        price: 35.0
      };

      const result = await createHttpRequest(app)
        .put(`/api/activities/${testActivityId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(result.body.data.title).toBe(updateData.title);
      expect(result.body.data.description).toBe(updateData.description);
      expect(result.body.data.price).toBe(updateData.price);
    });

    it('should fail without authentication', async () => {
      const result = await createHttpRequest(app)
        .put(`/api/activities/${testActivityId}`)
        .send({ title: '未授权更新' });

      expect(result.status).toBe(401);
    });

    it('should fail for non-owner', async () => {
      // 创建另一个用户
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const nonOwnerUsername = `nonowner_${timestamp}_${randomId}`;
      
      await createHttpRequest(app)
        .post('/api/users/register')
        .send({
          username: nonOwnerUsername,
          password: 'password123',
          email: `nonowner_${timestamp}_${randomId}@example.com`,
          phone: '13800138300',
          realName: 'Non Owner'
        });

      const loginResult = await createHttpRequest(app)
        .post('/api/users/login')
        .send({
          username: nonOwnerUsername,
          password: 'password123'
        });

      const nonOwnerToken = loginResult.body.data.token;

      const result = await createHttpRequest(app)
        .put(`/api/activities/${testActivityId}`)
        .set('Authorization', `Bearer ${nonOwnerToken}`)
        .send({ title: '非拥有者更新' });

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(false);
      expect(result.body.message).toContain('权限不足');
    });
  });

  describe('DELETE /api/activities/:id', () => {
    let testActivityId: number;

    beforeAll(async () => {
      const createResult = await createHttpRequest(app)
        .post('/api/activities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '待删除活动',
          description: '这个活动将被删除',
          category: 'running',
          location: '杭州公园',
          startTime: new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 121 * 60 * 60 * 1000).toISOString(),
          maxParticipants: 50,
          price: 0
        });
      
      testActivityId = createResult.body.data.id;
    });

    it('should delete activity successfully', async () => {
      const result = await createHttpRequest(app)
        .delete(`/api/activities/${testActivityId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);

      // 验证活动已被删除
      const getResult = await createHttpRequest(app)
        .get(`/api/activities/${testActivityId}`);

      expect(getResult.body.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const result = await createHttpRequest(app)
        .delete(`/api/activities/${testActivityId}`);

      expect(result.status).toBe(401);
    });
  });
});
