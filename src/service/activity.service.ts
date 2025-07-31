import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../entity/Activity';
import {
  CreateActivityDTO,
  UpdateActivityDTO,
  SearchActivityDTO,
} from '../dto/activity.dto';

/**
 * 活动服务类
 * 负责活动相关的业务逻辑处理
 */
@Provide()
export class ActivityService {
  @InjectEntityModel(Activity)
  activityRepository: Repository<Activity>;

  /**
   * 创建新活动
   * @param activityData 活动数据
   * @param creatorId 创建者ID
   * @returns 创建的活动信息
   */
  async createActivity(
    activityData: CreateActivityDTO,
    creatorId: number
  ): Promise<Activity> {
    // 验证时间逻辑
    if (new Date(activityData.startTime) >= new Date(activityData.endTime)) {
      throw new Error('开始时间必须早于结束时间');
    }

    if (new Date(activityData.startTime) <= new Date()) {
      throw new Error('开始时间必须晚于当前时间');
    }

    const activity = this.activityRepository.create({
      ...activityData,
      creatorId,
      currentParticipants: 0,
    });

    return await this.activityRepository.save(activity);
  }

  /**
   * 获取活动列表
   * @param searchParams 搜索参数
   * @returns 活动列表和总数
   */
  async getActivities(searchParams: SearchActivityDTO): Promise<{
    activities: Activity[];
    total: number;
  }> {
    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .leftJoinAndSelect('activity.creator', 'creator')
      .where('activity.isActive = :isActive', { isActive: true });

    // 关键词搜索
    if (searchParams.search) {
      queryBuilder.andWhere(
        '(activity.title LIKE :search OR activity.description LIKE :search)',
        { search: `%${searchParams.search}%` }
      );
    }

    // 分类筛选
    if (searchParams.category) {
      // 中英文分类映射
      const categoryMapping: { [key: string]: string[] } = {
        足球: ['足球', 'football'],
        篮球: ['篮球', 'basketball'],
        网球: ['网球', 'tennis'],
        羽毛球: ['羽毛球', 'badminton'],
        乒乓球: ['乒乓球', 'table tennis', 'ping pong'],
        游泳: ['游泳', 'swimming'],
        跑步: ['跑步', 'running'],
        健身: ['健身', 'fitness', 'gym'],
      };

      const possibleCategories = categoryMapping[searchParams.category] || [
        searchParams.category,
      ];
      queryBuilder.andWhere('activity.category IN (:...categories)', {
        categories: possibleCategories,
      });
    }

    // 状态筛选（基于时间）
    if (searchParams.status) {
      const now = new Date();

      if (
        searchParams.status === 'registration_open' ||
        searchParams.status === '报名中'
      ) {
        // 报名中：当前时间 < 开始时间
        queryBuilder.andWhere('activity.startTime > :now', { now });
      } else if (
        searchParams.status === 'in_progress' ||
        searchParams.status === '进行中'
      ) {
        // 进行中：开始时间 <= 当前时间 <= 结束时间
        queryBuilder.andWhere(
          'activity.startTime <= :now AND activity.endTime >= :now',
          { now }
        );
      } else if (
        searchParams.status === 'completed' ||
        searchParams.status === '已结束'
      ) {
        // 已结束：当前时间 > 结束时间
        queryBuilder.andWhere('activity.endTime < :now', { now });
      }
    }

    // 时间范围筛选
    if (searchParams.startDate && searchParams.endDate) {
      queryBuilder.andWhere(
        'activity.startTime BETWEEN :startDate AND :endDate',
        {
          startDate: searchParams.startDate,
          endDate: searchParams.endDate,
        }
      );
    }

    // 排序
    queryBuilder.orderBy('activity.createdAt', 'DESC');

    // 分页
    const page = searchParams.page || 1;
    const limit = searchParams.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [activities, total] = await queryBuilder.getManyAndCount();

    return { activities, total };
  }

  /**
   * 根据ID获取活动详情
   * @param id 活动ID
   * @returns 活动详情
   */
  async getActivityById(id: number): Promise<Activity | null> {
    return await this.activityRepository.findOne({
      where: { id, isActive: true },
      relations: ['creator', 'registrations', 'comments'],
    });
  }

  /**
   * 更新活动信息
   * @param id 活动ID
   * @param updateData 更新数据
   * @param userId 操作用户ID
   * @returns 更新后的活动信息
   */
  async updateActivity(
    id: number,
    updateData: UpdateActivityDTO,
    userId: number
  ): Promise<Activity | null> {
    const activity = await this.activityRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!activity) {
      throw new Error('活动不存在');
    }

    // 检查权限：只有创建者可以修改活动
    if (activity.creatorId !== userId) {
      throw new Error('权限不足，只有活动创建者可以修改活动');
    }

    // 如果活动已开始，限制可修改的字段
    if (new Date(activity.startTime) <= new Date()) {
      const allowedFields = ['description', 'imageUrl'];
      const updateKeys = Object.keys(updateData);
      const hasDisallowedFields = updateKeys.some(
        key => !allowedFields.includes(key)
      );

      if (hasDisallowedFields) {
        throw new Error('活动已开始，只能修改描述和图片');
      }
    }

    // 验证时间逻辑（如果更新了时间）
    if (updateData.startTime || updateData.endTime) {
      const startTime = updateData.startTime || activity.startTime;
      const endTime = updateData.endTime || activity.endTime;

      if (new Date(startTime) >= new Date(endTime)) {
        throw new Error('开始时间必须早于结束时间');
      }

      if (new Date(startTime) <= new Date()) {
        throw new Error('开始时间必须晚于当前时间');
      }
    }

    Object.assign(activity, updateData);
    return await this.activityRepository.save(activity);
  }

  /**
   * 删除活动
   * @param id 活动ID
   * @param userId 操作用户ID
   * @returns 操作结果
   */
  async deleteActivity(id: number, userId: number): Promise<boolean> {
    const activity = await this.activityRepository.findOne({
      where: { id },
    });

    if (!activity) {
      throw new Error('活动不存在');
    }

    // 检查权限：只有创建者可以删除活动
    if (activity.creatorId !== userId) {
      throw new Error('无权限删除此活动');
    }

    // 软删除：设置为不活跃状态
    activity.isActive = false;
    await this.activityRepository.save(activity);
    return true;
  }

  /**
   * 获取用户创建的活动
   * @param userId 用户ID
   * @returns 活动列表
   */
  async getUserActivities(userId: number): Promise<Activity[]> {
    return await this.activityRepository.find({
      where: { creatorId: userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 更新活动参与人数
   * @param activityId 活动ID
   * @param increment 增量（正数为增加，负数为减少）
   */
  async updateParticipantCount(
    activityId: number,
    increment: number
  ): Promise<void> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
    });

    if (!activity) {
      throw new Error('活动不存在');
    }

    const newCount = activity.currentParticipants + increment;

    if (newCount < 0) {
      throw new Error('参与人数不能为负数');
    }

    if (newCount > activity.maxParticipants) {
      throw new Error('参与人数超过上限');
    }

    activity.currentParticipants = newCount;
    await this.activityRepository.save(activity);
  }

  /**
   * 获取活动的报名列表
   * @param activityId 活动ID
   * @returns 报名列表
   */
  async getActivityRegistrations(activityId: number): Promise<any[]> {
    const activity = await this.activityRepository.findOne({
      where: { id: activityId },
      relations: ['registrations', 'registrations.user'],
    });

    if (!activity) {
      throw new Error('活动不存在');
    }

    return activity.registrations.map(registration => ({
      id: registration.id,
      userId: registration.userId,
      activityId: registration.activityId,
      notes: registration.notes,
      registrationTime: registration.createdAt,
      user: {
        id: registration.user.id,
        username: registration.user.username,
        realName: registration.user.realName,
        email: registration.user.email,
        phone: registration.user.phone,
      },
    }));
  }
}
