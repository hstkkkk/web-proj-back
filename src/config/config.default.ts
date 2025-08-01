import { MidwayConfig } from '@midwayjs/core';
import * as entity from '../entity';

export default {
  // use for cookie sign key, should change to your own and keep security
  keys: '1753846892615_4396',
  koa: {
    port: 7001,
  },
  cors: {
    origin: '*', // 开发环境允许所有源，生产环境需要更严格
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  },
  crossDomain: {
    allowOrigin: '*',
    credentials: true,
  },
  typeorm: {
    dataSource: {
      default: {
        type: 'sqlite',
        database: './database.sqlite',
        synchronize: true,
        logging: false,
        entities: [
          entity.User,
          entity.Activity,
          entity.Registration,
          entity.Comment,
          entity.Order,
        ],
      },
    },
  },
  validate: {
    validationOptions: {
      allowUnknown: false,
    },
  },
  staticFile: {
    dirs: {
      default: {
        prefix: '/',
        dir: 'public',
      },
      another: {
        prefix: '/assets',
        dir: 'public/assets',
      },
    },
  },
} as MidwayConfig;
