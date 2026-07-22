import { isSupabaseConfigured, publicEnv } from '../env';

describe('publicEnv', () => {
  it('exposes default app name', () => {
    expect(publicEnv.NEXT_PUBLIC_APP_NAME.length).toBeGreaterThan(0);
  });

  it('reports supabase configuration state', () => {
    expect(typeof isSupabaseConfigured()).toBe('boolean');
  });
});
