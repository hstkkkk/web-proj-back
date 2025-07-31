import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entity/Comment';
import { Activity } from '../entity/Activity';
import { User } from '../entity/User';

/**
 * 评论服务类
 * 负责活动评论相关的业务逻辑处理
 */
@Provide()
export class CommentService {
  @InjectEntityModel(Comment)
  commentRepository: Repository<Comment>;

  @InjectEntityModel(Activity)
  activityRepository: Repository<Activity>;

  @InjectEntityModel(User)
  userRepository: Repository<User>;

  /**
   * 创建评论
   * @param userId 用户ID
   * @param activityId 活动ID
   * @param content 评论内容
   * @param rating 评分（可选）
   * @returns 评论信息
   */
  async createComment(
    userId: number,
    activityId: number,
    content: string,
    rating?: number
  ): Promise<Comment> {
    // 验证活动是否存在
    const activity = await this.activityRepository.findOne({
      where: { id: activityId, isActive: true },
    });

    if (!activity) {
      throw new Error('活动不存在');
    }

    // 如果提供了评分，验证评分范围
    if (rating !== null && rating !== undefined && (rating < 1 || rating > 5)) {
      throw new Error('评分必须在1-5之间');
    }

    // 检查用户是否已经评论过
    const existingComment = await this.commentRepository.findOne({
      where: { userId, activityId },
    });

    if (existingComment) {
      throw new Error('您已经评论过这个活动');
    }

    const comment = this.commentRepository.create({
      userId,
      activityId,
      content,
      rating,
    });

    return await this.commentRepository.save(comment);
  }

  /**
   * 获取活动的评论列表
   * @param activityId 活动ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 评论列表
   */
  async getActivityComments(
    activityId: number,
    page = 1,
    limit = 10
  ): Promise<{
    comments: Comment[];
    total: number;
    averageRating: number;
  }> {
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.activityId = :activityId', { activityId })
      .orderBy('comment.createdAt', 'DESC');

    // 分页
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [comments, total] = await queryBuilder.getManyAndCount();

    // 计算平均评分
    const avgRatingResult = await this.commentRepository
      .createQueryBuilder('comment')
      .select('AVG(comment.rating)', 'averageRating')
      .where('comment.activityId = :activityId', { activityId })
      .getRawOne();

    const averageRating = parseFloat(avgRatingResult.averageRating) || 0;

    return {
      comments,
      total,
      averageRating: Math.round(averageRating * 10) / 10, // 保留一位小数
    };
  }

  /**
   * 获取用户的评论列表
   * @param userId 用户ID
   * @returns 评论列表
   */
  async getUserComments(userId: number): Promise<Comment[]> {
    return await this.commentRepository.find({
      where: { userId },
      relations: ['activity'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 删除评论
   * @param commentId 评论ID
   * @param userId 用户ID
   * @returns 操作结果
   */
  async deleteComment(commentId: number, userId: number): Promise<boolean> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('评论不存在');
    }

    // 检查权限：只有评论者本人可以删除评论
    if (comment.userId !== userId) {
      throw new Error('无权限删除此评论');
    }

    await this.commentRepository.remove(comment);
    return true;
  }

  /**
   * 获取活动的评分统计
   * @param activityId 活动ID
   * @returns 评分统计
   */
  async getActivityRatingStats(activityId: number): Promise<{
    averageRating: number;
    totalComments: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const comments = await this.commentRepository.find({
      where: { activityId },
    });

    const totalComments = comments.length;
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    let totalRating = 0;
    comments.forEach(comment => {
      totalRating += comment.rating;
      ratingDistribution[comment.rating]++;
    });

    const averageRating =
      totalComments > 0
        ? Math.round((totalRating / totalComments) * 10) / 10
        : 0;

    return {
      averageRating,
      totalComments,
      ratingDistribution,
    };
  }
}
