import Link from 'next/link';
import { ArrowRight, Boxes, ShieldCheck, Workflow } from 'lucide-react';
import { APP_NAME } from '@senvirox/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { publicEnv } from '@/lib/env';

const pillars = [
  {
    title: 'Clean Architecture API',
    description: 'Express domain, application, and infrastructure layers with typed ports and DI.',
    icon: Workflow,
  },
  {
    title: 'Next.js Console Shell',
    description:
      'App Router, Tailwind tokens, and shadcn-style primitives ready for feature modules.',
    icon: Boxes,
  },
  {
    title: 'Enterprise Baseline',
    description:
      'Structured logging, health probes, metrics, JWT middleware, and shared contracts.',
    icon: ShieldCheck,
  },
] as const;

export default function HomePage() {
  return (
    <div className="container py-12 md:py-16">
      <section className="mx-auto max-w-3xl animate-fade-in text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Module 1 · Project Foundation
        </p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          {APP_NAME} enterprise platform foundation
        </h1>
        <p className="mt-4 text-pretty text-lg text-muted-foreground">
          Production-ready monorepo baseline for the SaaS console and device control plane. Shared
          types, validated config, health surfaces, and UI system — without feature-module bloat.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/health">
              View system health
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a
              href={publicEnv.NEXT_PUBLIC_API_URL.replace(/\/api\/v1$/, '/health')}
              target="_blank"
              rel="noreferrer"
            >
              Open API /health
            </a>
          </Button>
        </div>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        {pillars.map((pillar) => (
          <Card key={pillar.title} className="animate-fade-in">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <pillar.icon className="h-5 w-5" aria-hidden />
              </div>
              <CardTitle>{pillar.title}</CardTitle>
              <CardDescription>{pillar.description}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </section>
    </div>
  );
}
