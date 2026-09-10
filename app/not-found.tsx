import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass, ArrowRight } from 'lucide-react';

// Next.js renders this for any route that calls notFound() or simply
// doesn't match a route -- it's the first thing a visitor following a
// mistyped or stale link sees. Previously there was no file here at all,
// so Next fell back to its own bare, unstyled default (confirmed live
// during the launch-readiness audit). This uses the same layout language
// as the rest of the app's empty/error states rather than a new design.
//
// `title.absolute` (not a plain string) so this always wins regardless of
// which nested layout's title it renders under -- confirmed live that
// without this, a 404 inside a route with its own layout.tsx (e.g.
// /builders/[id] with a nonexistent id) borrowed that layout's own title
// instead of a real "not found" one, in one observed case doubling the
// "— NeedSaaS" suffix on top of it.
export const metadata: Metadata = {
  title: { absolute: 'Page not found — NeedSaaS' },
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
        <Compass className="h-7 w-7" />
      </div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        The page you&apos;re looking for doesn&apos;t exist — it may have been moved, renamed, or the link
        might be out of date.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground shadow-soft transition hover:bg-brand/90"
      >
        Back to homepage <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
