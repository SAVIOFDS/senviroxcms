import request from 'supertest';
import { createContainer } from '../src/container.js';
import { createApp } from '../src/app.js';
import { appConfig } from '../src/config/app.js';

describe('Metrics endpoint protection', () => {
  const originalToken = appConfig.metricsToken;

  afterEach(() => {
    (appConfig as { metricsToken?: string }).metricsToken = originalToken;
  });

  it('allows /metrics without token when METRICS_TOKEN is unset', async () => {
    (appConfig as { metricsToken?: string }).metricsToken = undefined;
    const container = createContainer({ useMemoryCache: true });
    const app = createApp(container);

    const res = await request(app).get('/metrics').expect(200);
    expect(res.text).toContain('senvirox_');
    await container.shutdown();
  });

  it('rejects /metrics without bearer when token configured', async () => {
    (appConfig as { metricsToken?: string }).metricsToken = 'test-metrics-token-24chars-min';
    const container = createContainer({ useMemoryCache: true });
    const app = createApp(container);

    const res = await request(app).get('/metrics').expect(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    await container.shutdown();
  });

  it('accepts /metrics with valid bearer token', async () => {
    (appConfig as { metricsToken?: string }).metricsToken = 'test-metrics-token-24chars-min';
    const container = createContainer({ useMemoryCache: true });
    const app = createApp(container);

    const res = await request(app)
      .get('/metrics')
      .set('Authorization', 'Bearer test-metrics-token-24chars-min')
      .expect(200);
    expect(res.text).toContain('senvirox_');
    await container.shutdown();
  });
});
