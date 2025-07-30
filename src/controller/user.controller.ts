import { Controller, Post, Get, Put, Body, Param } from '@midwayjs/core';
import { Validate } from '@midwayjs/validate';
import { Inject } from '@midwayjs/core';
import { UserService } from '../service/user.service';
import { CreateUserDTO, LoginDTO, UpdateUserDTO } from '../dto/user.dto';

/**
 * 用户控制器
 * 处理用户相关的HTTP请求
 */
@Controller('/api/users')
export class UserController {
  @Inject()
  userService: UserService;

  /**
   * 用户注册
   */
  @Post('/register')
  @Validate()
  async register(@Body() userData: CreateUserDTO) {
    try {
      const user = await this.userService.createUser(userData);
      return {
        success: true,
        message: '注册成功',
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * 用户登录
   */
  @Post('/login')
  @Validate()
  async login(@Body() loginData: LoginDTO) {
    try {
      const user = await this.userService.validateUser(
        loginData.username,
        loginData.password
      );
      if (user) {
        return {
          success: true,
          message: '登录成功',
          data: user,
        };
      } else {
        return {
          success: false,
          message: '用户名或密码错误',
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
   * 获取用户信息
   */
  @Get('/:id')
  async getUserInfo(@Param('id') id: string) {
    try {
      const user = await this.userService.getUserById(parseInt(id));
      if (user) {
        return {
          success: true,
          data: user,
        };
      } else {
        return {
          success: false,
          message: '用户不存在',
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
   * 更新用户信息
   */
  @Put('/:id')
  @Validate()
  async updateUser(@Param('id') id: string, @Body() updateData: UpdateUserDTO) {
    try {
      const user = await this.userService.updateUser(parseInt(id), updateData);
      return {
        success: true,
        message: '更新成功',
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
