import {
  Controller,
  Post,
  Get,
  Put,
  Del,
  Body,
  Query,
  Param,
  Inject,
} from '@midwayjs/core';
import { Validate } from '@midwayjs/validate';
import { Context } from '@midwayjs/koa';
import { ActivityService } from '../service/activity.service';
import { JWTService } from '../service/jwt.service';
import {
  CreateActivityDTO,
  UpdateActivityDTO,
  SearchActivityDTO,
} from '../dto/activity.dto';

/**
 * 活动控制器
 * 处理活动相关的HTTP请求
 */
@Controller('/api/activities')
export class ActivityController {
  @Inject()
  activityService: ActivityService;

  @Inject()
  jwtService: JWTService;

  @Inject()
  ctx: Context;

  /**
   * 创建活动
   */
  @Post('/')
  @Validate()
  async createActivity(@Body() activityData: CreateActivityDTO) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        this.ctx.status = 401;
        return {
          success: false,
          message: '未提供认证令牌',
        };
      }

      const activity = await this.activityService.createActivity(
        activityData,
        userId
      );
      return {
        success: true,
        message: '活动创建成功',
        data: activity,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取活动列表
   */
  @Get('/')
  async getActivities(@Query() searchParams: SearchActivityDTO) {
    try {
      const result = await this.activityService.getActivities(searchParams);
      return {
        success: true,
        data: result.activities,
        total: result.total,
        page: searchParams.page || 1,
        limit: searchParams.limit || 10,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取活动详情
   */
  @Get('/:id')
  async getActivityDetail(@Param('id') id: string) {
    try {
      const activity = await this.activityService.getActivityById(parseInt(id));
      if (activity) {
        return {
          success: true,
          data: activity,
        };
      } else {
        return {
          success: false,
          message: '活动不存在',
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
   * 更新活动信息
   */
  @Put('/:id')
  @Validate()
  async updateActivity(
    @Param('id') id: string,
    @Body() updateData: UpdateActivityDTO
  ) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        this.ctx.status = 401;
        return {
          success: false,
          message: '未提供认证令牌',
        };
      }

      const activity = await this.activityService.updateActivity(
        parseInt(id),
        updateData,
        userId
      );
      return {
        success: true,
        message: '活动更新成功',
        data: activity,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 删除活动
   */
  @Del('/:id')
  async deleteActivity(@Param('id') id: string) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        this.ctx.status = 401;
        return {
          success: false,
          message: '未提供认证令牌',
        };
      }

      await this.activityService.deleteActivity(parseInt(id), userId);
      return {
        success: true,
        message: '活动删除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取我创建的活动
   */
  @Get('/my/created')
  async getMyActivities() {
    try {
      // 在实际应用中，应该从JWT Token中获取用户ID
      const userId = 1;
      const activities = await this.activityService.getUserActivities(userId);
      return {
        success: true,
        data: activities,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取活动的报名列表（仅活动创建者可查看）
   */
  @Get('/:id/registrations')
  async getActivityRegistrations(@Param('id') id: string) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        this.ctx.status = 401;
        return {
          success: false,
          message: '未提供认证令牌',
        };
      }

      // Check if user is the activity creator
      const activity = await this.activityService.getActivityById(parseInt(id));
      if (!activity) {
        this.ctx.status = 404;
        return {
          success: false,
          message: '活动不存在',
        };
      }

      if (activity.creatorId !== userId) {
        return {
          success: false,
          message: '权限不足，只有活动创建者可以查看报名列表',
        };
      }

      // Get registrations for this activity
      const registrations = await this.activityService.getActivityRegistrations(
        parseInt(id)
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
   * 从JWT token中获取当前用户ID
   */
  private async getCurrentUserId(): Promise<number | null> {
    const authHeader = this.ctx.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const token = this.jwtService.extractTokenFromHeader(authHeader);

    if (!token) {
      return null;
    }

    const decoded = this.jwtService.verifyToken(token);

    if (!decoded) {
      return null;
    }

    return decoded.userId;
  }
}
