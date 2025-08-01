import { MidwayConfig } from '@midwayjs/core';
import * as entity from '../entity';

export default {
  // use for cookie sign key, should change to your own and keep security
  keys: '1753846892615_4396',
  koa: {
    port: 7001,
  },
  cors: {
    origin: (ctx) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:7001',
        'http://localhost:7001',
        'http://127.0.0.1:5173'
      ];
      const requestOrigin = ctx.get('origin');
      return allowedOrigins.includes(requestOrigin) ? requestOrigin : 'http://localhost:5173';
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  },
  crossDomain: {
    allowOrigin: (ctx) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:7001',
        'http://localhost:7001',
        'http://127.0.0.1:5173'
      ];
      const requestOrigin = ctx.get('origin');
      return allowedOrigins.includes(requestOrigin) ? requestOrigin : 'http://localhost:5173';
    },
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
