import { Controller, Post, Get, Del, Body, Param, Inject } from '@midwayjs/core';
import { Validate } from '@midwayjs/validate';
import { Context } from '@midwayjs/koa';
import { RegistrationService } from '../service/registration.service';
import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 报名DTO
 */
export class CreateRegistrationDTO {
  @Rule(RuleType.number().required())
  activityId: number;

  @Rule(RuleType.string().optional())
  notes?: string;
}

/**
 * 报名控制器
 * 处理活动报名相关的HTTP请求
 */
@Controller('/api/registrations')
export class RegistrationController {
  @Inject()
  registrationService: RegistrationService;

  @Inject()
  ctx: Context;

  /**
   * 报名活动
   */
  @Post('/')
  @Validate()
  async registerActivity(@Body() registrationData: CreateRegistrationDTO) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        this.ctx.status = 401;
        return {
          success: false,
          message: '未提供认证令牌',
        };
      }

      const registration = await this.registrationService.registerForActivity(
        userId,
        registrationData.activityId,
        registrationData.notes
      );
      return {
        success: true,
        message: '报名成功',
        data: registration,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 取消报名
   */
  @Del('/activity/:activityId')
  async cancelRegistration(@Param('activityId') activityId: string) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        this.ctx.status = 401;
        return {
          success: false,
          message: '未提供认证令牌',
        };
      }

      await this.registrationService.cancelRegistration(
        userId,
        parseInt(activityId)
      );
      return {
        success: true,
        message: '取消报名成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 取消报名（通过报名ID）
   */
  @Del('/:id')
  async cancelRegistrationById(@Param('id') id: string) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        this.ctx.status = 401;
        return {
          success: false,
          message: '未提供认证令牌',
        };
      }

      await this.registrationService.cancelRegistrationById(
        parseInt(id),
        userId
      );
      return {
        success: true,
        message: '取消报名成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取我的报名记录
   */
  @Get('/my')
  async getMyRegistrations() {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        this.ctx.status = 401;
        return {
          success: false,
          message: '未提供认证令牌',
        };
      }

      const registrations = await this.registrationService.getUserRegistrations(
        userId
      );
      return {
        success: true,
        data: registrations,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取活动的报名列表（活动创建者使用）
   */
  @Get('/activity/:activityId')
  async getActivityRegistrations(@Param('activityId') activityId: string) {
    try {
      const registrations =
        await this.registrationService.getActivityRegistrations(
          parseInt(activityId)
        );
      return {
        success: true,
        data: registrations,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 检查是否已报名
   */
  @Get('/check/:activityId')
  async checkRegistration(@Param('activityId') activityId: string) {
    try {
      // 在实际应用中，应该从JWT Token中获取用户ID
      const userId = 1;
      const isRegistered = await this.registrationService.isUserRegistered(
        userId,
        parseInt(activityId)
      );
      return {
        success: true,
        data: { isRegistered },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 从JWT token中获取当前用户ID
   */
  private async getCurrentUserId(): Promise<number | null> {
    const authHeader = this.ctx.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, 'your-secret-key') as any;
      return decoded.userId;
    } catch (error) {
      return null;
    }
  }
}
