import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { FileUserRepository } from '../src/infrastructure/auth/FileUserRepository.js';
import { User } from '../src/domain/entities/User.js';
import { ScryptPasswordHasher } from '../src/infrastructure/security/ScryptPasswordHasher.js';

describe('FileUserRepository', () => {
  let dir: string;
  let path: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'senvirox-users-'));
    path = join(dir, 'users.json');
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('persists users across repository instances', async () => {
    const hasher = new ScryptPasswordHasher();
    const repoA = new FileUserRepository(path);
    const now = new Date();
    const user = User.create({
      id: randomUUID(),
      email: 'persist@senvirox.local',
      fullName: 'Persist User',
      role: 'admin',
      organizationId: null,
      passwordHash: await hasher.hash('SecurePass1'),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await repoA.create(user);
    expect(await repoA.count()).toBe(1);

    const repoB = new FileUserRepository(path);
    const loaded = await repoB.findByEmail('persist@senvirox.local');
    expect(loaded?.id).toBe(user.id);
    expect(loaded?.role).toBe('admin');
    expect(await repoB.count()).toBe(1);
  });
});
