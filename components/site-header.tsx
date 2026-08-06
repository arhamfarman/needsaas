'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from '@/components/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { LayoutDashboard, LogOut, Menu, User, Rocket, Package, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/search', label: 'Explore' },
  { href: '/search?tab=needs', label: 'Needs' },
  { href: '/software', label: 'Software' },
  { href: '/builders', label: 'Builders' },
  { href: '/starter-packs', label: 'Starter Packs' },
  { href: '/pricing', label: 'Pricing' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-7">
          <Link href="/" className="transition hover:opacity-80">
            <Logo size={26} />
          </Link>
          <nav className="hidden items-center gap-0.5 md:flex">
            {NAV.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href.split('?')[0]));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {profile?.builder_onboarded ? (
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Link href="/dashboard/builder">
                    <Package className="mr-1.5 h-4 w-4" />
                    Builder Dashboard
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="ghost" size="sm" className="text-brand hover:text-brand/80">
                  <Link href="/onboarding/builder">
                    <Rocket className="mr-1.5 h-4 w-4" />
                    Become a Builder
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-1.5 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition hover:bg-muted/60">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                        {(profile?.username ?? user.email ?? 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">
                      {profile?.username ?? 'Account'}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">
                    {profile?.username ?? user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {profile?.builder_onboarded && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/builder">
                        <Package className="mr-2 h-4 w-4" /> Builder Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {!profile?.builder_onboarded && (
                    <DropdownMenuItem asChild>
                      <Link href="/onboarding/builder">
                        <Rocket className="mr-2 h-4 w-4" /> Become a Builder
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {profile?.is_admin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Settings className="mr-2 h-4 w-4" /> Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {profile && (
                    <DropdownMenuItem asChild>
                      <Link href={`/builders/${profile.id}`}>
                        <User className="mr-2 h-4 w-4" /> My profile
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/signin">Sign in</Link>
              </Button>
              <Button asChild size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-soft">
                <Link href="/signin?tab=signup">Get started</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="flex items-center md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-border bg-card">
              <div className="flex h-full flex-col gap-1 p-4">
                <Link href="/" className="mb-4" onClick={() => setOpen(false)}>
                  <Logo size={24} />
                </Link>
                {NAV.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                <div className="mt-auto space-y-2 border-t border-border/60 pt-4">
                  {user ? (
                    <>
                      <SheetClose asChild>
                        <Link href="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">
                          <LayoutDashboard className="h-4 w-4" /> Dashboard
                        </Link>
                      </SheetClose>
                      {profile?.builder_onboarded ? (
                        <SheetClose asChild>
                          <Link href="/dashboard/builder" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">
                            <Package className="h-4 w-4" /> Builder Dashboard
                          </Link>
                        </SheetClose>
                      ) : (
                        <SheetClose asChild>
                          <Link href="/onboarding/builder" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand hover:bg-brand/5">
                            <Rocket className="h-4 w-4" /> Become a Builder
                          </Link>
                        </SheetClose>
                      )}
                      {profile?.is_admin && (
                        <SheetClose asChild>
                          <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">
                            <Settings className="h-4 w-4" /> Admin Dashboard
                          </Link>
                        </SheetClose>
                      )}
                      <Button variant="outline" className="w-full" onClick={() => { signOut(); setOpen(false); }}>
                        <LogOut className="mr-2 h-4 w-4" /> Sign out
                      </Button>
                    </>
                  ) : (
                    <>
                      <SheetClose asChild>
                        <Button asChild variant="outline" className="w-full">
                          <Link href="/signin">Sign in</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button asChild className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
                          <Link href="/signin?tab=signup">Get started</Link>
                        </Button>
                      </SheetClose>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
