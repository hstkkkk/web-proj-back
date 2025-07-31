import { Provide } from '@midwayjs/core';
import * as jwt from 'jsonwebtoken';

/**
 * JWT服务类
 * 负责JWT token的生成和验证
 */
@Provide()
export class JWTService {
  private readonly secret = 'your-secret-key'; // 在生产环境中应该从配置文件读取
  private readonly expiresIn = '7d'; // token有效期7天

  /**
   * 生成JWT token
   * @param payload token载荷
   * @returns JWT token字符串
   */
  generateToken(payload: any): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  /**
   * 验证JWT token
   * @param token JWT token字符串
   * @returns 解码后的载荷或null
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      return null;
    }
  }

  /**
   * 从请求头中提取token
   * @param authHeader Authorization请求头
   * @returns token字符串或null
   */
  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }
}
