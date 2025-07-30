import { Rule, RuleType } from '@midwayjs/validate';

/**
 * 用户注册DTO
 */
export class CreateUserDTO {
  @Rule(RuleType.string().required())
  username: string;

  @Rule(RuleType.string().min(6).required())
  password: string;

  @Rule(RuleType.string().email().required())
  email: string;

  @Rule(RuleType.string().optional())
  phone?: string;

  @Rule(RuleType.string().optional())
  realName?: string;
}

/**
 * 用户登录DTO
 */
export class LoginDTO {
  @Rule(RuleType.string().required())
  username: string;

  @Rule(RuleType.string().required())
  password: string;
}

/**
 * 更新用户信息DTO
 */
export class UpdateUserDTO {
  @Rule(RuleType.string().optional())
  email?: string;

  @Rule(RuleType.string().optional())
  phone?: string;

  @Rule(RuleType.string().optional())
  realName?: string;
}
