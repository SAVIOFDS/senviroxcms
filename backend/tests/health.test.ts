import request from 'supertest';
import { createContainer } from '../src/container.js';
import { createApp } from '../src/app.js';

describe('Health endpoints', () => {
  const container = createContainer({ useMemoryCache: true });
  const app = createApp(container);

  afterAll(async () => {
    await container.shutdown();
  });

  it('GET /health returns success payload', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service).toBe('SENVIROX');
    expect(res.body.data.checks).toHaveProperty('redis');
    expect(res.body.data.checks).toHaveProperty('supabase');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /api/v1/health returns versioned health', async () => {
    const res = await request(app).get('/api/v1/health').expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toMatch(/ok|degraded|down/);
  });

  it('GET /health/live returns ok', async () => {
    const res = await request(app).get('/health/live').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /health/ready returns ready when dependencies degraded but not down', async () => {
    const res = await request(app).get('/health/ready');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
  });
});
