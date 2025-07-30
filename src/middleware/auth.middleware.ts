import { Inject, Middleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { httpError } from '@midwayjs/core';
import * as jwt from 'jsonwebtoken';
import { UserService } from '../service/user.service';

@Middleware()
export class AuthMiddleware {
  @Inject()
  userService: UserService;

  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const authHeader = ctx.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new httpError.UnauthorizedError('未提供认证令牌');
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      try {
        const decoded = jwt.verify(token, 'your-secret-key') as any;
        const user = await this.userService.getUserById(decoded.userId);
        
        if (!user) {
          throw new httpError.UnauthorizedError('用户不存在');
        }
        
        ctx.user = user;
        await next();
      } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
          throw new httpError.UnauthorizedError('无效的认证令牌');
        }
        throw error;
      }
    };
  }
}
