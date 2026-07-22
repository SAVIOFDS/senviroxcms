import Link from 'next/link';
import { MonitorSmartphone } from 'lucide-react';
import { publicEnv } from '@/lib/env';
import { Button } from '@/components/ui/button';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <MonitorSmartphone className="h-5 w-5" aria-hidden />
          </span>
          <span>{publicEnv.NEXT_PUBLIC_APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Home</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/health">Health</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/account">Account</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Register</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
