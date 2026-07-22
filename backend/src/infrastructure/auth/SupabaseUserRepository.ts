import type { UserRole } from '@senvirox/shared';
import { isUserRole } from '@senvirox/shared';
import { User } from '../../domain/entities/User.js';
import type { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { AppError } from '../../domain/errors/AppError.js';
import { getSupabaseAdmin } from '../database/SupabaseClient.js';

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id: string | null;
  password_hash: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function mapRow(row: UserRow): User {
  if (!isUserRole(row.role)) {
    throw AppError.internal(`Invalid role in database for user ${row.id}`);
  }
  return User.create({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role as UserRole,
    organizationId: row.organization_id,
    passwordHash: row.password_hash,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

/**
 * Supabase Postgres user repository.
 * Requires table `app_users` (see database/001_app_users.sql).
 */
export class SupabaseUserRepository implements IUserRepository {
  private client() {
    const client = getSupabaseAdmin();
    if (!client) {
      throw AppError.serviceUnavailable('Supabase is not configured');
    }
    return client;
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.client()
      .from('app_users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw AppError.internal('Failed to load user', error.message);
    return data ? mapRow(data as UserRow) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.client()
      .from('app_users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();
    if (error) throw AppError.internal('Failed to load user by email', error.message);
    return data ? mapRow(data as UserRow) : null;
  }

  async create(user: User): Promise<User> {
    const payload = {
      id: user.id,
      email: user.email.toLowerCase(),
      full_name: user.fullName,
      role: user.role,
      organization_id: user.organizationId,
      password_hash: user.passwordHash,
      is_active: user.isActive,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString(),
    };
    const { data, error } = await this.client()
      .from('app_users')
      .insert(payload)
      .select('*')
      .single();
    if (error) {
      if (error.code === '23505') {
        throw AppError.conflict('An account with this email already exists');
      }
      throw AppError.internal('Failed to create user', error.message);
    }
    return mapRow(data as UserRow);
  }

  async update(user: User): Promise<User> {
    const payload = {
      email: user.email.toLowerCase(),
      full_name: user.fullName,
      role: user.role,
      organization_id: user.organizationId,
      password_hash: user.passwordHash,
      is_active: user.isActive,
      updated_at: user.updatedAt.toISOString(),
    };
    const { data, error } = await this.client()
      .from('app_users')
      .update(payload)
      .eq('id', user.id)
      .select('*')
      .single();
    if (error) throw AppError.internal('Failed to update user', error.message);
    if (!data) throw AppError.notFound('User');
    return mapRow(data as UserRow);
  }

  async count(): Promise<number> {
    const { count, error } = await this.client()
      .from('app_users')
      .select('*', { count: 'exact', head: true });
    if (error) throw AppError.internal('Failed to count users', error.message);
    return count ?? 0;
  }
}
