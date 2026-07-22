import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">404</p>
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="max-w-md text-muted-foreground">
        The route you requested is not part of the Project Foundation module.
      </p>
      <Button asChild>
        <Link href="/">Back to foundation</Link>
      </Button>
    </div>
  );
}
