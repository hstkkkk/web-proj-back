import { createApp, close } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';
import { Application } from '@midwayjs/koa';

describe('Basic App Test', () => {
  let app: Application;

  beforeAll(async () => {
    // create app
    app = await createApp<Framework>();
  });

  afterAll(async () => {
    // close app
    await close(app);
  });

  it('should create app successfully', () => {
    expect(app).toBeDefined();
  });

  it('should have proper configuration', () => {
    expect(app.getConfig()).toBeDefined();
  });
});
