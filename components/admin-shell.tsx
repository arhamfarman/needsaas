'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { Loader2, Lock } from 'lucide-react';
import {
  LayoutDashboard, Package, Lightbulb, Users, UserCircle, FileText,
  FolderTree, PackageCheck, Star, Trophy, BarChart3, Settings,
} from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/software', label: 'Software', icon: Package },
  { href: '/admin/needs', label: 'Needs', icon: Lightbulb },
  { href: '/admin/builders', label: 'Builders', icon: Users },
  { href: '/admin/users', label: 'Users', icon: UserCircle },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/starter-packs', label: 'Starter Packs', icon: PackageCheck },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/rewards', label: 'Rewards', icon: Trophy },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Lock className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Sign in to access the admin dashboard.</p>
        <Link href="/signin" className="text-sm font-medium text-brand hover:underline">Sign in</Link>
      </div>
    );
  }

  if (!profile?.is_admin) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Lock className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">You need admin access to view this page.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1600px] gap-0 px-4 py-6 sm:px-6 lg:px-8">
      {/* Sidebar */}
      <aside className="sticky top-20 hidden h-fit w-60 shrink-0 md:block">
        <div className="mb-4 flex items-center gap-2 px-3">
          <Logo size={22} />
          <span className="font-display text-sm font-semibold text-foreground">Admin</span>
        </div>
        <nav className="space-y-0.5">
          {NAV.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand/10 text-brand'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-2 md:hidden">
        {NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                isActive ? 'bg-brand/10 text-brand' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="min-w-0 flex-1 md:pl-6">
        {children}
      </main>
    </div>
  );
}
