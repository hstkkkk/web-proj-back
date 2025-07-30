import { MidwayConfig } from '@midwayjs/core';
import { User } from '../entity/User';
import { Activity } from '../entity/Activity';
import { Registration } from '../entity/Registration';
import { Comment } from '../entity/Comment';
import { Order } from '../entity/Order';

export default {
  // use for cookie sign key, should change to your own and keep security
  keys: '1753846892615_4396',
  koa: {
    port: 7001,
  },
  cors: {
    origin: 'http://localhost:5173', // 前端开发服务器地址
    credentials: true,
  },
  typeorm: {
    dataSource: {
      default: {
        type: 'sqlite',
        database: './database.sqlite',
        synchronize: true,
        logging: false,
        entities: [User, Activity, Registration, Comment, Order],
      },
    },
  },
  validate: {
    validationOptions: {
      allowUnknown: false,
    },
  },
} as MidwayConfig;
