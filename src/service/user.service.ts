import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/User';
import { CreateUserDTO, UpdateUserDTO } from '../dto/user.dto';
import * as crypto from 'crypto';

/**
 * 用户服务类
 * 负责用户相关的业务逻辑处理
 */
@Provide()
export class UserService {
  @InjectEntityModel(User)
  userRepository: Repository<User>;

  /**
   * 创建新用户
   * @param userData 用户数据
   * @returns 创建的用户信息（不包含密码）
   */
  async createUser(userData: CreateUserDTO): Promise<Partial<User>> {
    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { username: userData.username },
    });
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.userRepository.findOne({
      where: { email: userData.email },
    });
    if (existingEmail) {
      throw new Error('邮箱已被注册');
    }

    // 加密密码
    const hashedPassword = this.hashPassword(userData.password);

    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    const { password, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
  }

  /**
   * 用户登录验证
   * @param username 用户名
   * @param password 密码
   * @returns 用户信息（不包含密码）
   */
  async validateUser(
    username: string,
    password: string
  ): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOne({
      where: { username, isActive: true },
    });

    if (user && this.verifyPassword(password, user.password)) {
      const { password: pwd, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  /**
   * 根据ID获取用户信息
   * @param id 用户ID
   * @returns 用户信息（不包含密码）
   */
  async getUserById(id: number): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
    });
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  /**
   * 更新用户信息
   * @param id 用户ID
   * @param updateData 更新数据
   * @returns 更新后的用户信息
   */
  async updateUser(
    id: number,
    updateData: UpdateUserDTO
  ): Promise<Partial<User> | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error('用户不存在');
    }

    // 如果更新邮箱，检查邮箱是否已被其他用户使用
    if (updateData.email && updateData.email !== user.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: updateData.email },
      });
      if (existingEmail && existingEmail.id !== id) {
        throw new Error('邮箱已被注册');
      }
    }

    Object.assign(user, updateData);
    const updatedUser = await this.userRepository.save(user);
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * 密码加密
   * @param password 原始密码
   * @returns 加密后的密码
   */
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * 密码验证
   * @param password 原始密码
   * @param hashedPassword 加密后的密码
   * @returns 验证结果
   */
  private verifyPassword(password: string, hashedPassword: string): boolean {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    return hash === hashedPassword;
  }
}
