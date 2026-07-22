import request from 'supertest';
import { createContainer } from '../src/container.js';
import { createApp } from '../src/app.js';

describe('System endpoints', () => {
  const container = createContainer({ useMemoryCache: true });
  const app = createApp(container);

  afterAll(async () => {
    await container.shutdown();
  });

  it('GET /api/v1/system/info returns platform metadata', async () => {
    const res = await request(app).get('/api/v1/system/info').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('SENVIROX');
    expect(res.body.data.apiVersion).toBe('v1');
    expect(res.body.data.node).toMatch(/^v\d+/);
  });

  it('GET /metrics exposes prometheus text', async () => {
    const res = await request(app).get('/metrics').expect(200);
    expect(res.text).toContain('senvirox_');
  });

  it('unknown route returns structured 404', async () => {
    const res = await request(app).get('/api/v1/does-not-exist').expect(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
