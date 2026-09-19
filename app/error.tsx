'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, RotateCw } from 'lucide-react';

// Next.js renders this for any unhandled error thrown while rendering a route
// (must be a Client Component per the framework's error-boundary contract).
// Without this file, an unhandled error falls back to Next's bare, unstyled
// default screen -- same class of gap app/not-found.tsx already fixed for 404s.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        This page hit an unexpected error. It&apos;s been logged — try again, or head back to the homepage.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-white px-5 py-2.5 text-sm font-medium text-foreground shadow-soft transition hover:bg-muted/40"
        >
          <RotateCw className="h-4 w-4" /> Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-soft transition hover:bg-brand/90"
        >
          Back to homepage <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
