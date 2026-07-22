'use client';

import { Activity, RefreshCw, Server } from 'lucide-react';
import type { HealthStatus } from '@senvirox/shared';
import { useApiHealth } from '@/hooks/use-api-health';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function statusVariant(
  status: HealthStatus | undefined,
): 'success' | 'warning' | 'danger' | 'secondary' {
  switch (status) {
    case 'ok':
      return 'success';
    case 'degraded':
      return 'warning';
    case 'down':
      return 'danger';
    default:
      return 'secondary';
  }
}

export function HealthStatusCard() {
  const { data, error, loading, refresh } = useApiHealth(15_000);

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" aria-hidden />
            API Health
          </CardTitle>
          <CardDescription>
            Live probe against the foundation backend health endpoint.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refresh()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={statusVariant(data?.status)}>
            {data?.status ?? (loading ? 'loading' : 'unknown')}
          </Badge>
          {data ? (
            <span className="text-sm text-muted-foreground">
              uptime {data.uptimeSeconds}s · v{data.version}
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Server className="h-4 w-4" aria-hidden />
              Redis
            </div>
            <Badge variant={statusVariant(data?.checks.redis)}>{data?.checks.redis ?? '—'}</Badge>
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Server className="h-4 w-4" aria-hidden />
              Supabase
            </div>
            <Badge variant={statusVariant(data?.checks.supabase)}>
              {data?.checks.supabase ?? '—'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
