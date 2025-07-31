import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 创建活动DTO
 */
export class CreateActivityDTO {
  @Rule(RuleType.string().required())
  title: string;

  @Rule(RuleType.string().required())
  description: string;

  @Rule(RuleType.string().required())
  location: string;

  @Rule(RuleType.date().required())
  startTime: Date;

  @Rule(RuleType.date().required())
  endTime: Date;

  @Rule(RuleType.number().min(0).default(0))
  price: number;

  @Rule(RuleType.number().min(1).required())
  maxParticipants: number;

  @Rule(RuleType.string().optional())
  imageUrl?: string;

  @Rule(RuleType.string().required())
  category: string;

  @Rule(RuleType.string().allow('').optional())
  requirements?: string;
}

/**
 * 更新活动DTO
 */
export class UpdateActivityDTO {
  @Rule(RuleType.string().optional())
  title?: string;

  @Rule(RuleType.string().optional())
  description?: string;

  @Rule(RuleType.string().optional())
  location?: string;

  @Rule(RuleType.date().optional())
  startTime?: Date;

  @Rule(RuleType.date().optional())
  endTime?: Date;

  @Rule(RuleType.number().min(0).optional())
  price?: number;

  @Rule(RuleType.number().min(1).optional())
  maxParticipants?: number;

  @Rule(RuleType.string().optional())
  imageUrl?: string;

  @Rule(RuleType.string().optional())
  category?: string;

  @Rule(RuleType.string().allow('').optional())
  requirements?: string;

  @Rule(RuleType.string().valid('active', 'cancelled', 'completed').optional())
  status?: string;
}

/**
 * 活动搜索DTO
 */
export class SearchActivityDTO {
  @Rule(RuleType.string().allow('').optional())
  search?: string; // 改名从 keyword 到 search

  @Rule(RuleType.string().allow('').optional())
  category?: string;

  @Rule(RuleType.string().allow('').optional())
  status?: string; // 添加 status 字段

  @Rule(RuleType.date().optional())
  startDate?: Date;

  @Rule(RuleType.date().optional())
  endDate?: Date;

  @Rule(RuleType.number().min(1).default(1))
  page: number;

  @Rule(RuleType.number().min(1).max(50).default(10))
  limit: number;
}
