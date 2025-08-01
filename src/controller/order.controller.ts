import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  Inject,
} from '@midwayjs/core';
import { Validate } from '@midwayjs/validate';
import { Context } from '@midwayjs/koa';
import { OrderService } from '../service/order.service';
import { JWTService } from '../service/jwt.service';
import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 创建订单DTO
 */
export class CreateOrderDTO {
  @Rule(RuleType.number().required())
  activityId: number;

  @Rule(RuleType.string().optional().allow(''))
  notes?: string;
}

/**
 * 订单控制器
 * 处理订单相关的HTTP请求
 */
@Controller('/api/orders')
export class OrderController {
  @Inject()
  ctx: Context;

  @Inject()
  orderService: OrderService;

  @Inject()
  jwtService: JWTService;

  private async getCurrentUserId(): Promise<number> {
    const token = this.ctx.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      this.ctx.status = 401;
      this.ctx.body = { error: 'Authentication token required' };
      throw new Error('Authentication token required');
    }

    try {
      const decoded = this.jwtService.verifyToken(token);
      if (!decoded || !decoded.userId) {
        this.ctx.status = 401;
        this.ctx.body = { error: 'Invalid or expired token' };
        throw new Error('Invalid or expired token');
      }
      return decoded.userId;
    } catch (error) {
      this.ctx.status = 401;
      this.ctx.body = { error: 'Invalid or expired token' };
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * 创建订单
   */
  @Post('/')
  @Validate()
  async createOrder(@Body() orderData: CreateOrderDTO) {
    try {
      const userId = await this.getCurrentUserId();
      const order = await this.orderService.createOrder(
        userId,
        orderData.activityId,
        orderData.notes
      );
      return {
        success: true,
        message: '订单创建成功',
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取我的订单列表
   */
  @Get('/my')
  async getMyOrders(@Query('status') status?: string) {
    try {
      const userId = await this.getCurrentUserId();
      const orders = await this.orderService.getUserOrders(userId, status);
      return {
        success: true,
        data: orders,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 根据订单号获取订单详情
   */
  @Get('/:orderNumber')
  async getOrderDetail(@Param('orderNumber') orderNumber: string) {
    try {
      const order = await this.orderService.getOrderByNumber(orderNumber);
      if (order) {
        return {
          success: true,
          data: order,
        };
      } else {
        return {
          success: false,
          message: '订单不存在',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 支付订单
   */
  @Put('/:orderNumber/pay')
  async payOrder(@Param('orderNumber') orderNumber: string) {
    try {
      const userId = await this.getCurrentUserId();
      const order = await this.orderService.payOrder(orderNumber, userId);
      return {
        success: true,
        message: '支付成功',
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 取消订单
   */
  @Put('/:orderNumber/cancel')
  async cancelOrder(@Param('orderNumber') orderNumber: string) {
    try {
      const userId = await this.getCurrentUserId();
      await this.orderService.cancelOrder(orderNumber, userId);
      return {
        success: true,
        message: '订单取消成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 申请退款
   */
  @Put('/:orderNumber/refund')
  async refundOrder(@Param('orderNumber') orderNumber: string) {
    try {
      const userId = await this.getCurrentUserId();
      await this.orderService.refundOrder(orderNumber, userId);
      return {
        success: true,
        message: '退款申请成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取订单统计信息
   */
  @Get('/stats/my')
  async getOrderStats() {
    try {
      const userId = await this.getCurrentUserId();
      const stats = await this.orderService.getOrderStats(userId);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
