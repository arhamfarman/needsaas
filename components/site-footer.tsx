import Link from 'next/link';
import { Logo } from '@/components/logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row">
          <div className="max-w-sm space-y-4">
            <Logo size={24} />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Where people discover software that solves their problems, and builders discover validated problems worth solving.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-4 sm:grid-cols-3">
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Explore</h4>
              <Link href="/search" className="block text-sm text-muted-foreground hover:text-foreground">All</Link>
              <Link href="/search?tab=needs" className="block text-sm text-muted-foreground hover:text-foreground">Needs</Link>
              <Link href="/search?tab=products" className="block text-sm text-muted-foreground hover:text-foreground">Software</Link>
              <Link href="/builders" className="block text-sm text-muted-foreground hover:text-foreground">Builders</Link>
            </div>
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">For builders</h4>
              <Link href="/dashboard?tab=products" className="block text-sm text-muted-foreground hover:text-foreground">List software</Link>
              <Link href="/pricing" className="block text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
              <Link href="/dashboard?tab=profile" className="block text-sm text-muted-foreground hover:text-foreground">Builder profile</Link>
            </div>
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">For seekers</h4>
              <Link href="/dashboard?tab=needs" className="block text-sm text-muted-foreground hover:text-foreground">Post a need</Link>
              <Link href="/search" className="block text-sm text-muted-foreground hover:text-foreground">Browse software</Link>
              <Link href="/signin?tab=signup" className="block text-sm text-muted-foreground hover:text-foreground">Create account</Link>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} NeedSaaS. All rights reserved.</p>
          <p>Find software. Or inspire someone to build it.</p>
        </div>
      </div>
    </footer>
  );
}
