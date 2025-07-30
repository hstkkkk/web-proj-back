import { createApp, close } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';
import { Application } from '@midwayjs/koa';
import { UserService } from '../../src/service/user.service';

describe('User Service', () => {
  let app: Application;
  let userService: UserService;

  beforeAll(async () => {
    app = await createApp<Framework>();
    userService = await app.getApplicationContext().getAsync(UserService);
  });

  afterAll(async () => {
    await close(app);
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const userData = {
        username: `servicetest1_${timestamp}_${randomId}`,
        password: 'password123',
        email: `servicetest1_${timestamp}_${randomId}@example.com`,
        phone: '13800138400',
        realName: 'Service Test User 1'
      };

      const result = await userService.createUser(userData);
      
      expect(result).toHaveProperty('id');
      expect(result.username).toBe(userData.username);
      expect(result.email).toBe(userData.email);
      expect(result.phone).toBe(userData.phone);
      expect(result.realName).toBe(userData.realName);
      // 密码应该被加密，不应该是明文
      expect(result.password).not.toBe(userData.password);
    });

    it('should throw error for duplicate username', async () => {
      const userData = {
        username: 'servicetest1', // 重复用户名
        password: 'password123',
        email: 'servicetest2@example.com',
        phone: '13800138401',
        realName: 'Service Test User 2'
      };

      await expect(userService.createUser(userData)).rejects.toThrow();
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        username: 'servicetest3',
        password: 'password123',
        email: 'servicetest1@example.com', // 重复邮箱
        phone: '13800138402',
        realName: 'Service Test User 3'
      };

      await expect(userService.createUser(userData)).rejects.toThrow();
    });
  });

  describe('validateUser', () => {
    let testUsername: string;
    
    beforeAll(async () => {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      testUsername = `validatetest4_${timestamp}_${randomId}`;
      
      // 创建测试用户
      await userService.createUser({
        username: testUsername,
        password: 'password123',
        email: `validatetest4_${timestamp}_${randomId}@example.com`,
        phone: '13800138500',
        realName: 'Validate Test User'
      });
    });

    it('should validate user successfully', async () => {
      const result = await userService.validateUser(testUsername, 'password123');
      
      expect(result).not.toBeNull();
      expect(result?.username).toBe(testUsername);
      expect(result?.email).toContain('validatetest4_'); // 检查邮箱包含前缀
    });

    it('should return null for wrong password', async () => {
      const result = await userService.validateUser(testUsername, 'wrongpassword');
      
      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      const result = await userService.validateUser('nonexistent', 'password123');
      
      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    let testUserId: number;
    let testUsername: string;

    beforeAll(async () => {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      testUsername = `findbyidtest5_${timestamp}_${randomId}`;
      
      const user = await userService.createUser({
        username: testUsername,
        password: 'password123',
        email: `findbyidtest5_${timestamp}_${randomId}@example.com`,
        phone: '13800138600',
        realName: 'Find By ID Test User'
      });
      testUserId = user.id!;
    });

    it('should find user by id successfully', async () => {
      const result = await userService.getUserById(testUserId);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(testUserId);
      expect(result?.username).toBe(testUsername);
      expect(result?.email).toContain('findbyidtest5_'); // 检查邮箱包含前缀
    });

    it('should return null for non-existent id', async () => {
      const result = await userService.getUserById(99999);
      
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    let testUserId: number;
    let testUsername: string;

    beforeAll(async () => {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      testUsername = `updatetest6_${timestamp}_${randomId}`;
      
      const user = await userService.createUser({
        username: testUsername,
        password: 'password123',
        email: `updatetest6_${timestamp}_${randomId}@example.com`,
        phone: '13800138800',
        realName: 'Update Test User'
      });
      testUserId = user.id!;
    });

    it('should update user successfully', async () => {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const updateData = {
        email: `updatetest6_new_${timestamp}_${randomId}@example.com`,
        phone: '13800138801',
        realName: 'Updated Test User'
      };

      const result = await userService.updateUser(testUserId, updateData);
      
      expect(result).not.toBeNull();
      expect(result?.email).toBe(updateData.email);
      expect(result?.phone).toBe(updateData.phone);
      expect(result?.realName).toBe(updateData.realName);
      expect(result?.username).toBe(testUsername); // 用户名不应该改变
    });

    it('should throw error for non-existent user', async () => {
      await expect(userService.updateUser(99999, { email: 'test@example.com' }))
        .rejects.toThrow('用户不存在');
    });
  });
});
