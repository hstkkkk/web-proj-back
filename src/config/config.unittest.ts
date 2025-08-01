import { MidwayConfig } from '@midwayjs/core';
import * as entity from '../entity';

export default {
  koa: {
    port: null,
  },
  cors: {
    origin: '*',
    credentials: false,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  },
  typeorm: {
    dataSource: {
      default: {
        type: 'sqlite',
        database: ':memory:',
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
} as MidwayConfig;
