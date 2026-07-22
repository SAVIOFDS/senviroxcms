import type { Metadata } from 'next';
import { HealthStatusCard } from '@/components/health-status-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isSupabaseConfigured, publicEnv } from '@/lib/env';

export const metadata: Metadata = {
  title: 'System Health',
};

export default function HealthPage() {
  return (
    <div className="container space-y-6 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">System Health</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Foundation observability surface. Backend liveness, readiness, and dependency checks are
          exposed for local development and production probes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <HealthStatusCard />
        </div>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Runtime configuration</CardTitle>
            <CardDescription>Public client configuration (no secrets).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2">
              <span className="text-muted-foreground">App URL</span>
              <span className="font-mono text-xs">{publicEnv.NEXT_PUBLIC_APP_URL}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2">
              <span className="text-muted-foreground">API URL</span>
              <span className="font-mono text-xs">{publicEnv.NEXT_PUBLIC_API_URL}</span>
            </div>
            <div className="flex items-center justify-between gap-3 py-2">
              <span className="text-muted-foreground">Supabase client</span>
              <span className="font-mono text-xs">
                {isSupabaseConfigured() ? 'configured' : 'not configured'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
