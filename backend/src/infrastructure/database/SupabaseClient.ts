import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { IDatabasePort } from '../../application/ports/IDatabasePort.js';
import { appConfig } from '../../config/app.js';
import { logger } from '../logging/logger.js';

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  const { url, serviceRoleKey } = appConfig.supabase;
  if (!url || !serviceRoleKey) {
    return null;
  }
  if (!adminClient) {
    adminClient = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminClient;
}

export class SupabaseDatabase implements IDatabasePort {
  isConfigured(): boolean {
    return Boolean(appConfig.supabase.url && appConfig.supabase.serviceRoleKey);
  }

  async ping(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }
    const client = getSupabaseAdmin();
    if (!client) return false;

    try {
      // Lightweight auth health probe — does not require app tables.
      const { error } = await client.auth.getSession();
      if (error) {
        logger.debug('Supabase ping returned error', { err: error });
        // getSession with service role often has no session; treat transport success as OK
      }
      return true;
    } catch (err) {
      logger.warn('Supabase ping failed', { err });
      return false;
    }
  }
}

export class NoopDatabase implements IDatabasePort {
  isConfigured(): boolean {
    return false;
  }

  async ping(): Promise<boolean> {
    return false;
  }
}
