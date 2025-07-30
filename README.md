# 体育活动管理系统 - 后端

基于 Midway.js 框架构建的企业级体育活动管理系统后端 API 服务。

## 🚀 技术栈

- **框架**: Midway.js 3.x
- **运行时**: Node.js >= 16.0.0
- **数据库**: SQLite (开发环境) / MySQL (生产环境)
- **ORM**: TypeORM
- **认证**: JWT (jsonwebtoken)
- **测试**: Jest + Midway Mock
- **代码检查**: ESLint + Prettier
- **API 文档**: 自动生成 RESTful API

## 📋 功能特性

### 🔐 用户认证模块
- 用户注册/登录
- JWT Token 认证
- 密码安全加密
- 用户信息管理
- 权限控制

### 🏃‍♀️ 活동管理模块
- 活동 CRUD 操作
- 活動列表分页查询
- 活動搜索和筛选
- 我的活動管理
- 活動状态管理

### 📝 报名管理模块
- 活動报名
- 报名状态跟踪
- 我的报名记录
- 报名统计
- 报名取消

### 💬 评论系统
- 活動评论
- 评分功能
- 评论管理
- 评分统计

### 📊 订单系统
- 订单创建
- 订单管理
- 支付集成
- 订单统计

### 🛡️ 安全防护
- 参数验证
- SQL 注入防护
- XSS 防护
- 请求频率限制
- 错误处理

## 🛠️ 开发环境设置

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
npm install
```

### 启动开发环境
```bash
npm run dev
```
API 服务将启动在: http://localhost:7001

### 启动生产环境
```bash
npm start
```

## 🧪 测试

### 运行所有测试
```bash
npm test
```

### 运行测试并生成覆盖率报告
```bash
npm run test:cov
```

### 代码检查
```bash
npm run lint
```

## 📁 项目结构

```
src/
├── configuration.ts     # Midway 配置
├── interface.ts        # TypeScript 接口定义
├── config/            # 配置文件
│   ├── config.default.ts  # 默认配置
│   └── config.unittest.ts # 测试配置
├── controller/        # 控制器层
│   ├── user.controller.ts      # 用户控制器
│   ├── activity.controller.ts  # 活动控制器
│   ├── registration.controller.ts # 报名控制器
│   ├── comment.controller.ts   # 评论控制器
│   └── order.controller.ts     # 订单控制器
├── service/           # 服务层
│   ├── user.service.ts         # 用户服务
│   ├── activity.service.ts     # 活动服务
│   ├── registration.service.ts # 报名服务
│   ├── comment.service.ts      # 评论服务
│   └── order.service.ts        # 订单服务
├── middleware/        # 中间件
│   ├── auth.middleware.ts      # 认证中间件
│   └── report.middleware.ts    # 日志中间件
├── filter/           # 异常过滤器
│   ├── default.filter.ts       # 默认异常处理
│   └── notfound.filter.ts      # 404 处理
└── entity/           # 数据实体
    ├── user.entity.ts          # 用户实体
    ├── activity.entity.ts      # 活动实体
    ├── registration.entity.ts  # 报名实体
    ├── comment.entity.ts       # 评论实体
    └── order.entity.ts         # 订单实体

test/
├── controller/       # 控制器测试
├── service/         # 服务测试
└── fixtures/        # 测试数据
```

## 🔧 配置说明

### 数据库配置
在 `src/config/config.default.ts` 中配置：
```typescript
export default {
  typeorm: {
    dataSource: {
      default: {
        type: 'sqlite',
        database: path.join(__dirname, '../../database.sqlite'),
        synchronize: true,
        entities: [User, Activity, Registration, Comment, Order],
      }
    }
  }
}
```

### JWT 配置
```typescript
export default {
  jwt: {
    secret: 'your-secret-key',
    expiresIn: '24h'
  }
}
```

## 🌐 API 接口文档

### 用户认证 API
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/profile` - 获取用户信息
- `PUT /api/users/profile` - 更新用户信息

### 活动管理 API
- `GET /api/activities` - 获取活动列表
- `GET /api/activities/:id` - 获取活动详情
- `POST /api/activities` - 创建活动
- `PUT /api/activities/:id` - 更新活动
- `DELETE /api/activities/:id` - 删除活动

### 报名管理 API
- `POST /api/registrations` - 报名活动
- `GET /api/registrations/my` - 我的报名记录
- `DELETE /api/registrations/activity/:id` - 取消报名

### 评论系统 API
- `POST /api/comments` - 发表评论
- `GET /api/comments/activity/:id` - 获取活动评论
- `DELETE /api/comments/:id` - 删除评论

### 订单系统 API
- `POST /api/orders` - 创建订单
- `GET /api/orders/my` - 我的订单
- `PUT /api/orders/:id/pay` - 支付订单

## 📊 数据模型

### 用户表 (User)
```sql
CREATE TABLE user (
  id INTEGER PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  realName VARCHAR(50),
  createdAt DATETIME,
  updatedAt DATETIME
);
```

### 活动表 (Activity)
```sql
CREATE TABLE activity (
  id INTEGER PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  location VARCHAR(200),
  startTime DATETIME,
  endTime DATETIME,
  maxParticipants INTEGER,
  currentParticipants INTEGER DEFAULT 0,
  creatorId INTEGER,
  createdAt DATETIME,
  updatedAt DATETIME
);
```

## 🔒 安全措施

### 认证中间件
```typescript
@Middleware()
export class AuthMiddleware {
  async resolve() {
    return async (ctx: Context, next: NextFunction) => {
      const token = ctx.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        throw new UnauthorizedError('未提供认证令牌');
      }
      // JWT 验证逻辑...
    };
  }
}
```

### 参数验证
```typescript
@Post('/register')
@Validate()
async register(@Body() user: CreateUserDTO) {
  // 自动参数验证
}
```

## 🚀 部署指南

### 环境变量
创建 `.env` 文件：
```env
NODE_ENV=production
JWT_SECRET=your-production-secret
DB_HOST=your-database-host
DB_PORT=3306
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_DATABASE=sports_activity
```

### Docker 部署
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 7001
CMD ["npm", "start"]
```

### PM2 部署
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

## 📈 性能优化

- 数据库查询优化
- Redis 缓存集成
- 接口响应压缩
- 静态资源 CDN
- 负载均衡配置

## 🔧 开发工具

- **调试**: VS Code + Node.js 调试配置
- **API 测试**: Postman/Insomnia
- **数据库管理**: SQLite Browser/MySQL Workbench
- **日志查看**: 文件日志 + 控制台输出

## 🤝 开发规范

### 代码风格
- 使用 TypeScript 严格模式
- 遵循 ESLint + Prettier 规范
- 使用装饰器模式
- 依赖注入模式

### API 设计规范
- RESTful API 设计
- 统一响应格式
- 错误码标准化
- 接口版本控制

### 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

## 📊 监控与日志

### 日志配置
```typescript
export default {
  midwayLogger: {
    default: {
      level: 'info',
      consoleLevel: 'warn',
    },
    clients: {
      coreLogger: {
        fileLogName: 'midway-core.log',
      },
      appLogger: {
        fileLogName: 'midway-app.log',
      },
    },
  },
}
```

### 健康检查
- `GET /api/health` - 服务健康状态
- `GET /api/metrics` - 性能指标

## 📞 联系方式

如有问题或建议，请联系开发团队。

## 📄 许可证

MIT License
