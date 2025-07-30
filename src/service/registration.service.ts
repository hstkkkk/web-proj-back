import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Registration } from '../entity/Registration';
import { Activity } from '../entity/Activity';
import { User } from '../entity/User';

/**
 * 报名服务类
 * 负责活动报名相关的业务逻辑处理
 */
@Provide()
export class RegistrationService {
  @InjectEntityModel(Registration)
  registrationRepository: Repository<Registration>;

  @InjectEntityModel(Activity)
  activityRepository: Repository<Activity>;

  @InjectEntityModel(User)
  userRepository: Repository<User>;

  /**
   * 用户报名活动
   * @param userId 用户ID
   * @param activityId 活动ID
   * @param notes 备注
   * @returns 报名信息
   */
  async registerForActivity(
    userId: number,
    activityId: number,
    notes?: string
  ): Promise<Registration> {
    // 检查活动是否存在且可报名
    const activity = await this.activityRepository.findOne({
      where: { id: activityId, isActive: true },
    });

    if (!activity) {
      throw new Error('活动不存在或已关闭');
    }

    // 检查活动是否已满员
    if (activity.currentParticipants >= activity.maxParticipants) {
      throw new Error('活动已满员');
    }

    // 检查活动是否已开始
    if (new Date(activity.startTime) <= new Date()) {
      throw new Error('活动已开始，无法报名');
    }

    // 检查用户是否已经报名
    const existingRegistration = await this.registrationRepository.findOne({
      where: {
        userId,
        activityId,
        status: 'confirmed',
      },
    });

    if (existingRegistration) {
      throw new Error('您已经报名了这个活动');
    }

    // 创建报名记录
    const registration = this.registrationRepository.create({
      userId,
      activityId,
      notes,
      status: 'confirmed',
    });

    const savedRegistration = await this.registrationRepository.save(
      registration
    );

    // 更新活动参与人数
    activity.currentParticipants += 1;
    await this.activityRepository.save(activity);

    return savedRegistration;
  }

  /**
   * 取消报名
   * @param userId 用户ID
   * @param activityId 活动ID
   * @returns 操作结果
   */
  async cancelRegistration(
    userId: number,
    activityId: number
  ): Promise<boolean> {
    const registration = await this.registrationRepository.findOne({
      where: {
        userId,
        activityId,
        status: 'confirmed',
      },
    });

    if (!registration) {
      throw new Error('未找到有效的报名记录');
    }

    // 检查活动是否已开始
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new Error('活动不存在');
    }

    if (new Date(activity.startTime) <= new Date()) {
      throw new Error('活动已开始，无法取消报名');
    }

    // 更新报名状态
    registration.status = 'cancelled';
    await this.registrationRepository.save(registration);

    // 更新活动参与人数
    activity.currentParticipants -= 1;
    await this.activityRepository.save(activity);

    return true;
  }

  /**
   * 获取用户的报名记录
   * @param userId 用户ID
   * @returns 报名记录列表
   */
  async getUserRegistrations(userId: number): Promise<Registration[]> {
    return await this.registrationRepository.find({
      where: { userId },
      relations: ['activity'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取活动的报名记录
   * @param activityId 活动ID
   * @returns 报名记录列表
   */
  async getActivityRegistrations(activityId: number): Promise<Registration[]> {
    return await this.registrationRepository.find({
      where: { activityId, status: 'confirmed' },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 检查用户是否已报名某活动
   * @param userId 用户ID
   * @param activityId 活动ID
   * @returns 是否已报名
   */
  async isUserRegistered(userId: number, activityId: number): Promise<boolean> {
    const registration = await this.registrationRepository.findOne({
      where: {
        userId,
        activityId,
        status: 'confirmed',
      },
    });

    return !!registration;
  }
}
