'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AccountPanel() {
  const router = useRouter();
  const { user, loading, logout, refreshProfile } = useAuth();

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  if (loading) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Loading session…
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Not signed in</CardTitle>
          <CardDescription>Authenticate to view your account profile.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Create account</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg animate-fade-in">
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Authenticated session from Module 2 Auth & RBAC.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-3 border-b border-border/60 py-2">
            <span className="text-muted-foreground">Name</span>
            <span>{user.fullName}</span>
          </div>
          <div className="flex justify-between gap-3 border-b border-border/60 py-2">
            <span className="text-muted-foreground">Email</span>
            <span className="font-mono text-xs">{user.email}</span>
          </div>
          <div className="flex items-center justify-between gap-3 py-2">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="success">{user.role}</Badge>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void logout().then(() => router.push('/login'));
            }}
          >
            Sign out
          </Button>
          <Button asChild variant="ghost">
            <Link href="/health">System health</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
