import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entity/Order';
import { Activity } from '../entity/Activity';
import { User } from '../entity/User';
import { Registration } from '../entity/Registration';

/**
 * 订单服务类
 * 负责活动订单相关的业务逻辑处理
 */
@Provide()
export class OrderService {
  @InjectEntityModel(Order)
  orderRepository: Repository<Order>;

  @InjectEntityModel(Activity)
  activityRepository: Repository<Activity>;

  @InjectEntityModel(User)
  userRepository: Repository<User>;

  @InjectEntityModel(Registration)
  registrationRepository: Repository<Registration>;

  /**
   * 创建订单
   * @param userId 用户ID
   * @param activityId 活动ID
   * @param notes 备注
   * @returns 订单信息
   */
  async createOrder(
    userId: number,
    activityId: number,
    notes?: string
  ): Promise<Order> {
    // 检查活动是否存在
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
      throw new Error('活动已开始，无法创建订单');
    }

    // 检查用户是否已有未支付的订单
    const existingOrder = await this.orderRepository.findOne({
      where: {
        userId,
        activityId,
        status: 'pending',
      },
    });

    if (existingOrder) {
      throw new Error('您已有该活动的待支付订单');
    }

    // 生成订单号
    const orderNumber = this.generateOrderNumber();

    const order = this.orderRepository.create({
      orderNumber,
      userId,
      activityId,
      activityTitle: activity.title,
      amount: activity.price,
      notes,
    });

    return await this.orderRepository.save(order);
  }

  /**
   * 获取用户订单列表
   * @param userId 用户ID
   * @param status 订单状态
   * @returns 订单列表
   */
  async getUserOrders(userId: number, status?: string): Promise<Order[]> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return await this.orderRepository.find({
      where,
      relations: ['activity'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根据订单号获取订单
   * @param orderNumber 订单号
   * @returns 订单信息
   */
  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    return await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['user'],
    });
  }

  /**
   * 支付订单
   * @param orderNumber 订单号
   * @param userId 用户ID
   * @returns 操作结果
   */
  async payOrder(orderNumber: string, userId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber, userId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== 'pending') {
      throw new Error('订单状态不正确');
    }

    // 再次检查活动状态
    const activity = await this.activityRepository.findOne({
      where: { id: order.activityId },
    });

    if (!activity || !activity.isActive) {
      throw new Error('活动不存在或已关闭');
    }

    if (activity.currentParticipants >= activity.maxParticipants) {
      throw new Error('活动已满员');
    }

    if (new Date(activity.startTime) <= new Date()) {
      throw new Error('活动已开始，无法支付');
    }

    // 更新订单状态
    order.status = 'paid';
    order.paymentStatus = 'success';
    const updatedOrder = await this.orderRepository.save(order);

    // 创建报名记录
    const registration = this.registrationRepository.create({
      userId,
      activityId: order.activityId,
      status: 'confirmed',
      notes: order.notes,
    });
    await this.registrationRepository.save(registration);

    // 更新活动参与人数
    activity.currentParticipants += 1;
    await this.activityRepository.save(activity);

    return updatedOrder;
  }

  /**
   * 取消订单
   * @param orderNumber 订单号
   * @param userId 用户ID
   * @returns 操作结果
   */
  async cancelOrder(orderNumber: string, userId: number): Promise<boolean> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber, userId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status === 'cancelled') {
      throw new Error('订单已取消');
    }

    if (order.status === 'paid') {
      // 已支付订单需要退款
      order.status = 'refunded';
      order.paymentStatus = 'success';

      // 减少活动参与人数
      const activity = await this.activityRepository.findOne({
        where: { id: order.activityId },
      });

      if (activity) {
        activity.currentParticipants -= 1;
        await this.activityRepository.save(activity);
      }
    } else {
      order.status = 'cancelled';
    }

    await this.orderRepository.save(order);
    return true;
  }

  /**
   * 申请退款
   * @param orderNumber 订单号
   * @param userId 用户ID
   * @returns 操作结果
   */
  async refundOrder(orderNumber: string, userId: number): Promise<boolean> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber, userId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    if (order.status !== 'paid') {
      throw new Error('只有已支付的订单才能申请退款');
    }

    // 检查活动是否已开始（可以根据业务需求调整）
    const activity = await this.activityRepository.findOne({
      where: { id: order.activityId },
    });

    if (activity && new Date(activity.startTime) <= new Date()) {
      throw new Error('活动已开始，无法申请退款');
    }

    // 设置订单状态为退款
    order.status = 'refunded';
    await this.orderRepository.save(order);

    // 删除相应的报名记录
    const registration = await this.registrationRepository.findOne({
      where: { userId, activityId: order.activityId },
    });

    if (registration) {
      await this.registrationRepository.remove(registration);
    }

    // 减少活动参与人数
    if (activity) {
      activity.currentParticipants -= 1;
      await this.activityRepository.save(activity);
    }

    return true;
  }

  /**
   * 获取订单统计信息
   * @param userId 用户ID
   * @returns 统计信息
   */
  async getOrderStats(userId: number): Promise<{
    totalOrders: number;
    paidOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    totalAmount: number;
  }> {
    const orders = await this.orderRepository.find({
      where: { userId },
    });

    const stats = {
      totalOrders: orders.length,
      paidOrders: 0,
      pendingOrders: 0,
      cancelledOrders: 0,
      totalAmount: 0,
    };

    orders.forEach(order => {
      switch (order.status) {
        case 'paid':
          stats.paidOrders++;
          stats.totalAmount += parseFloat(order.amount.toString());
          break;
        case 'pending':
          stats.pendingOrders++;
          break;
        case 'cancelled':
        case 'refunded':
          stats.cancelledOrders++;
          break;
      }
    });

    return stats;
  }

  /**
   * 生成订单号
   * @returns 订单号
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ORD${timestamp}${random}`;
  }
}
