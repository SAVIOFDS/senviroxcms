import type { User } from '../../domain/entities/User.js';
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { AppError } from '../../domain/errors/AppError.js';

/**
 * Process-local user store for foundation/dev/test.
 * Production Module 2 wiring can swap to SupabaseUserRepository without changing AuthService.
 */
export class InMemoryUserRepository implements IUserRepository {
  private readonly byId = new Map<string, User>();
  private readonly emailIndex = new Map<string, string>();

  async findById(id: string): Promise<User | null> {
    return this.byId.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const id = this.emailIndex.get(email.trim().toLowerCase());
    if (!id) return null;
    return this.byId.get(id) ?? null;
  }

  async create(user: User): Promise<User> {
    const email = user.email.toLowerCase();
    if (this.emailIndex.has(email)) {
      throw AppError.conflict('An account with this email already exists');
    }
    this.byId.set(user.id, user);
    this.emailIndex.set(email, user.id);
    return user;
  }

  async update(user: User): Promise<User> {
    if (!this.byId.has(user.id)) {
      throw AppError.notFound('User');
    }
    const previous = this.byId.get(user.id);
    if (previous && previous.email !== user.email) {
      this.emailIndex.delete(previous.email);
      this.emailIndex.set(user.email.toLowerCase(), user.id);
    }
    this.byId.set(user.id, user);
    return user;
  }

  async count(): Promise<number> {
    return this.byId.size;
  }

  /** Test helper */
  clear(): void {
    this.byId.clear();
    this.emailIndex.clear();
  }
}
