'use client';

import { useCallback, useEffect, useState } from 'react';
import type { HealthCheckDto } from '@senvirox/shared';
import { ApiClientError, apiClient } from '@/lib/api-client';

interface HealthState {
  readonly data: HealthCheckDto | null;
  readonly error: string | null;
  readonly loading: boolean;
  readonly refresh: () => Promise<void>;
}

export function useApiHealth(pollMs = 30_000): HealthState {
  const [data, setData] = useState<HealthCheckDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const health = await apiClient.getHealth();
      setData(health);
      setError(null);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to load health';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (pollMs <= 0) return;
    const id = window.setInterval(() => {
      void refresh();
    }, pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, refresh]);

  return { data, error, loading, refresh };
}
