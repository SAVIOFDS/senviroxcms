import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import type { UserRole } from '@senvirox/shared';
import { User } from '../../domain/entities/User.js';
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { AppError } from '../../domain/errors/AppError.js';
import { logger } from '../logging/logger.js';

interface StoredUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId: string | null;
  passwordHash: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Durable single-node user store (JSON file).
 * Suitable for VPS self-host when Supabase is not configured.
 * Use a volume mount for DATA_DIR in Docker.
 */
export class FileUserRepository implements IUserRepository {
  private loaded = false;
  private readonly byId = new Map<string, User>();
  private readonly emailIndex = new Map<string, string>();
  private writeChain: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    try {
      await fs.mkdir(dirname(this.filePath), { recursive: true });
      const raw = await fs.readFile(this.filePath, 'utf8');
      const rows = JSON.parse(raw) as StoredUser[];
      for (const row of rows) {
        const user = User.create({
          id: row.id,
          email: row.email,
          fullName: row.fullName,
          role: row.role,
          organizationId: row.organizationId,
          passwordHash: row.passwordHash,
          isActive: row.isActive,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        });
        this.byId.set(user.id, user);
        this.emailIndex.set(user.email.toLowerCase(), user.id);
      }
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') {
        logger.warn('Failed to load user store; starting empty', { err, path: this.filePath });
      }
    }
    this.loaded = true;
  }

  private toStored(user: User): StoredUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
      passwordHash: user.passwordHash,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  private async persist(): Promise<void> {
    const rows = Array.from(this.byId.values()).map((u) => this.toStored(u));
    const tmp = `${this.filePath}.tmp`;
    await fs.mkdir(dirname(this.filePath), { recursive: true });
    await fs.writeFile(tmp, JSON.stringify(rows, null, 2), 'utf8');
    await fs.rename(tmp, this.filePath);
  }

  private enqueuePersist(): Promise<void> {
    this.writeChain = this.writeChain.then(() => this.persist()).catch((err) => {
      logger.error('Failed to persist user store', { err, path: this.filePath });
    });
    return this.writeChain;
  }

  async findById(id: string): Promise<User | null> {
    await this.ensureLoaded();
    return this.byId.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    await this.ensureLoaded();
    const id = this.emailIndex.get(email.trim().toLowerCase());
    if (!id) return null;
    return this.byId.get(id) ?? null;
  }

  async create(user: User): Promise<User> {
    await this.ensureLoaded();
    const email = user.email.toLowerCase();
    if (this.emailIndex.has(email)) {
      throw AppError.conflict('An account with this email already exists');
    }
    this.byId.set(user.id, user);
    this.emailIndex.set(email, user.id);
    await this.enqueuePersist();
    return user;
  }

  async update(user: User): Promise<User> {
    await this.ensureLoaded();
    if (!this.byId.has(user.id)) {
      throw AppError.notFound('User');
    }
    const previous = this.byId.get(user.id);
    if (previous && previous.email !== user.email) {
      this.emailIndex.delete(previous.email);
      this.emailIndex.set(user.email.toLowerCase(), user.id);
    }
    this.byId.set(user.id, user);
    await this.enqueuePersist();
    return user;
  }

  async count(): Promise<number> {
    await this.ensureLoaded();
    return this.byId.size;
  }
}
