import request from 'supertest';
import { createContainer } from '../src/container.js';
import { createApp } from '../src/app.js';
import { InMemoryUserRepository } from '../src/infrastructure/auth/InMemoryUserRepository.js';
import { InMemoryRefreshTokenStore } from '../src/infrastructure/auth/InMemoryRefreshTokenStore.js';
import { ScryptPasswordHasher } from '../src/infrastructure/security/ScryptPasswordHasher.js';

describe('Auth module', () => {
  const users = new InMemoryUserRepository();
  const refresh = new InMemoryRefreshTokenStore();
  const container = createContainer({
    useMemoryCache: true,
    userRepository: users,
    refreshTokenStore: refresh,
  });
  const app = createApp(container);

  afterAll(async () => {
    await container.shutdown();
  });

  beforeEach(() => {
    users.clear();
    refresh.clear();
  });

  it('registers first user as super_admin and returns session', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'admin@senvirox.local',
        password: 'SecurePass1',
        fullName: 'Platform Admin',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('super_admin');
    expect(res.body.data.tokens.accessToken).toBeTruthy();
    expect(res.body.data.tokens.refreshToken).toBeTruthy();
  });

  it('registers subsequent users as viewer', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'admin@senvirox.local',
        password: 'SecurePass1',
        fullName: 'Platform Admin',
      })
      .expect(201);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'viewer@senvirox.local',
        password: 'SecurePass1',
        fullName: 'Viewer User',
      })
      .expect(201);

    expect(res.body.data.user.role).toBe('viewer');
  });

  it('logs in with valid credentials', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'ops@senvirox.local',
      password: 'SecurePass1',
      fullName: 'Ops',
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ops@senvirox.local', password: 'SecurePass1' })
      .expect(200);

    expect(res.body.data.user.email).toBe('ops@senvirox.local');
    expect(res.body.data.tokens.tokenType).toBe('Bearer');
  });

  it('rejects invalid login', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'ops@senvirox.local',
      password: 'SecurePass1',
      fullName: 'Ops',
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ops@senvirox.local', password: 'WrongPass99' })
      .expect(401);

    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns current user via /me', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      email: 'me@senvirox.local',
      password: 'SecurePass1',
      fullName: 'Me User',
    });
    const token = reg.body.data.tokens.accessToken as string;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.email).toBe('me@senvirox.local');
  });

  it('rotates refresh tokens', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      email: 'refresh@senvirox.local',
      password: 'SecurePass1',
      fullName: 'Refresh User',
    });
    const oldRefresh = reg.body.data.tokens.refreshToken as string;

    const refreshed = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefresh })
      .expect(200);

    expect(refreshed.body.data.tokens.refreshToken).toBeTruthy();
    expect(refreshed.body.data.tokens.refreshToken).not.toBe(oldRefresh);

    await request(app).post('/api/v1/auth/refresh').send({ refreshToken: oldRefresh }).expect(401);
  });

  it('enforces admin RBAC on admin-probe', async () => {
    await request(app).post('/api/v1/auth/register').send({
      email: 'root@senvirox.local',
      password: 'SecurePass1',
      fullName: 'Root',
    });
    const viewerReg = await request(app).post('/api/v1/auth/register').send({
      email: 'viewer2@senvirox.local',
      password: 'SecurePass1',
      fullName: 'Viewer Two',
    });
    const viewerToken = viewerReg.body.data.tokens.accessToken as string;

    await request(app)
      .get('/api/v1/auth/admin-probe')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(403);

    const rootLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'root@senvirox.local',
      password: 'SecurePass1',
    });
    const rootToken = rootLogin.body.data.tokens.accessToken as string;

    const ok = await request(app)
      .get('/api/v1/auth/admin-probe')
      .set('Authorization', `Bearer ${rootToken}`)
      .expect(200);
    expect(ok.body.data.ok).toBe(true);
  });

  it('changes password and invalidates sessions', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      email: 'pwd@senvirox.local',
      password: 'SecurePass1',
      fullName: 'Pwd User',
    });
    const access = reg.body.data.tokens.accessToken as string;
    const refreshToken = reg.body.data.tokens.refreshToken as string;

    await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${access}`)
      .send({ currentPassword: 'SecurePass1', newPassword: 'SecurePass2x' })
      .expect(200);

    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pwd@senvirox.local', password: 'SecurePass1' })
      .expect(401);

    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'pwd@senvirox.local', password: 'SecurePass2x' })
      .expect(200);

    await request(app).post('/api/v1/auth/refresh').send({ refreshToken }).expect(401);
  });

  it('hashes passwords with scrypt', async () => {
    const hasher = new ScryptPasswordHasher();
    const hash = await hasher.hash('SecurePass1');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(await hasher.verify('SecurePass1', hash)).toBe(true);
    expect(await hasher.verify('nope', hash)).toBe(false);
  });
});
