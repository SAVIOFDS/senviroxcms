import { publicEnv } from '@/lib/env';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-8">
      <div className="container flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {publicEnv.NEXT_PUBLIC_APP_NAME}. Project Foundation module.
        </p>
        <p className="font-mono text-xs">API: {publicEnv.NEXT_PUBLIC_API_URL}</p>
      </div>
    </footer>
  );
}
