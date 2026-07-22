import type { Metadata } from 'next';
import { AccountPanel } from '@/components/auth/account-panel';

export const metadata: Metadata = {
  title: 'Account',
};

export default function AccountPage() {
  return (
    <div className="container space-y-6 py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-semibold tracking-tight">Your account</h1>
        <p className="mt-2 text-muted-foreground">
          Profile and session controls backed by JWT access + rotating refresh tokens.
        </p>
      </div>
      <AccountPanel />
    </div>
  );
}
