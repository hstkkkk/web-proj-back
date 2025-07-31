import {
  Controller,
  Post,
  Get,
  Del,
  Body,
  Param,
  Query,
  Inject,
} from '@midwayjs/core';
import { Validate } from '@midwayjs/validate';
import { Context } from '@midwayjs/koa';
import { CommentService } from '../service/comment.service';
import { JWTService } from '../service/jwt.service';
import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 创建评论DTO
 */
export class CreateCommentDTO {
  @Rule(RuleType.number().required())
  activityId: number;

  @Rule(RuleType.string().required())
  content: string;

  @Rule(RuleType.number().min(1).max(5).optional())
  rating?: number;
}

/**
 * 评论控制器
 * 处理活动评论相关的HTTP请求
 */
@Controller('/api/comments')
export class CommentController {
  @Inject()
  commentService: CommentService;

  @Inject()
  jwtService: JWTService;

  @Inject()
  ctx: Context;

  /**
   * 创建评论
   */
  @Post('/')
  @Validate()
  async createComment(@Body() commentData: CreateCommentDTO) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        this.ctx.status = 401;
        return {
          success: false,
          message: '未提供认证令牌',
        };
      }

      const comment = await this.commentService.createComment(
        userId,
        commentData.activityId,
        commentData.content,
        commentData.rating || null
      );
      return {
        success: true,
        message: '评论创建成功',
        data: comment,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取活动评论列表
   */
  @Get('/activity/:activityId')
  async getActivityComments(
    @Param('activityId') activityId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    try {
      const result = await this.commentService.getActivityComments(
        parseInt(activityId),
        parseInt(page) || 1,
        parseInt(limit) || 10
      );
      return {
        success: true,
        data: result.comments,
        total: result.total,
        averageRating: result.averageRating,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取我的评论列表
   */
  @Get('/my')
  async getMyComments() {
    try {
      // 在实际应用中，应该从JWT Token中获取用户ID
      const userId = 1;
      const comments = await this.commentService.getUserComments(userId);
      return {
        success: true,
        data: comments,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 删除评论
   */
  @Del('/:commentId')
  async deleteComment(@Param('commentId') commentId: string) {
    try {
      // 在实际应用中，应该从JWT Token中获取用户ID
      const userId = 1;
      await this.commentService.deleteComment(parseInt(commentId), userId);
      return {
        success: true,
        message: '评论删除成功',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 获取活动评分统计
   */
  @Get('/stats/:activityId')
  async getActivityRatingStats(@Param('activityId') activityId: string) {
    try {
      const stats = await this.commentService.getActivityRatingStats(
        parseInt(activityId)
      );
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
