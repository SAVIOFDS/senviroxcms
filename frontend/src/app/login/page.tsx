import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default function LoginPage() {
  return (
    <div className="container space-y-6 py-12">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No account?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
