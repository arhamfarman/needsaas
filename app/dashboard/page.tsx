'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import type { Category, Need, Product, Contribution } from '@/lib/types';
import { NeedForm } from '@/components/forms/need-form';
import { ProfileForm } from '@/components/forms/profile-form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { VerifiedBadge } from '@/components/verified-badge';
import { toast } from 'sonner';
import {
  Lightbulb, Bookmark, DollarSign, Bell, Settings as SettingsIcon,
  Plus, Trash2, ArrowUp, LogIn, Sparkles, ArrowRight, ExternalLink,
  Rocket, Package, Crown, Heart, CheckCircle2, Search,
} from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';

const VALID_TABS = ['needs', 'bookmarks', 'contributions', 'following', 'notifications', 'settings'] as const;
type TabKey = (typeof VALID_TABS)[number];

function DashboardContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const tabParam = params.get('tab') as TabKey | null;
  const initialTab = VALID_TABS.includes(tabParam as TabKey) ? (tabParam as TabKey) : 'needs';

  const [categories, setCategories] = useState<Category[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [bookmarks, setBookmarks] = useState<Product[]>([]);
  const [contributions, setContributions] = useState<(Contribution & { need?: Need })[]>([]);
  const [following, setFollowing] = useState<Need[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data as Category[]);
    });
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    const [n, b, c, f, notifs] = await Promise.all([
      supabase.from('needs').select(`*, category:categories(*)`).eq('owner_id', user.id).order('created_at', { ascending: false }),
      supabase.from('bookmarks').select(`product:products(*, category:categories(*), profile:profiles(username, verified))`).eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('contributions').select(`*, need:needs(id, title, status, vote_count, reward_amount)`).eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('need_follows').select(`need:needs(*, category:categories(*))`).eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ]);
    setNeeds((n.data as Need[]) ?? []);
    setBookmarks((b.data ?? []).map((b: any) => b.product as Product));
    setContributions((c.data as any[]) ?? []);
    setFollowing((f.data ?? []).map((f: any) => f.need as Need));
    setNotifications((notifs.data as any[]) ?? []);
    setDataLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData, refreshKey]);

  function setTab(t: string) {
    const sp = new URLSearchParams(params.toString());
    if (t === 'needs') sp.delete('tab'); else sp.set('tab', t);
    router.replace(`/dashboard?${sp.toString()}`);
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="mb-8 h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
          <LogIn className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Sign in to view your dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create an account to post needs, vote, bookmark software, and contribute to build rewards.</p>
        <Button asChild className="mt-6 bg-brand text-brand-foreground hover:bg-brand/90">
          <Link href="/signin?tab=signup">Create an account</Link>
        </Button>
      </div>
    );
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? profile?.username ?? 'there';
  const isBuilder = profile?.builder_onboarded;
  const isPro = profile?.pro_builder;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      {/* Welcome */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Welcome back, {firstName}.
            </h1>
            {isPro && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-brand-foreground">
                <Crown className="h-3 w-3" /> Pro
              </span>
            )}
            {profile?.verified && <VerifiedBadge showLabel />}
          </div>
          <p className="mt-1.5 text-muted-foreground">Manage your needs, bookmarks, and contributions.</p>
        </div>
        <div className="flex items-center gap-2">
          {isBuilder ? (
            <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link href="/dashboard/builder"><Package className="mr-2 h-4 w-4" /> Builder Dashboard</Link>
            </Button>
          ) : (
            <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link href="/onboarding/builder"><Rocket className="mr-2 h-4 w-4" /> Become a Builder</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Lightbulb} label="My Needs" value={needs.length} />
        <StatCard icon={Bookmark} label="Bookmarks" value={bookmarks.length} />
        <StatCard icon={DollarSign} label="Contributions" value={contributions.length} />
        <StatCard icon={Heart} label="Following" value={following.length} />
      </div>

      {/* Quick actions */}
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <QuickAction icon={Lightbulb} label="Post a Need" href="/dashboard?tab=needs" />
        <QuickAction icon={Search} label="Browse Software" href="/software" />
        <QuickAction icon={Search} label="Browse Needs" href="/search?tab=needs" />
        {isBuilder ? (
          <QuickAction icon={Package} label="Builder Dashboard" href="/dashboard/builder" />
        ) : (
          <QuickAction icon={Rocket} label="Become a Builder" href="/onboarding/builder" highlight />
        )}
      </div>

      {/* Become a Builder banner (only for non-builders) */}
      {!isBuilder && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-brand/20 bg-gradient-to-r from-brand/10 via-brand/5 to-transparent p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
                <Rocket className="h-5 w-5 text-brand" /> Ready to build?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Become a Builder to publish software, receive reviews, and connect your products to needs.
              </p>
            </div>
            <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link href="/onboarding/builder">Start Builder Onboarding <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      )}

      <Tabs value={initialTab} onValueChange={setTab}>
        <TabsList className="flex-wrap bg-white border border-border/60 shadow-card">
          <TabsTrigger value="needs" className="gap-1.5"><Lightbulb className="h-4 w-4" /> My Needs</TabsTrigger>
          <TabsTrigger value="bookmarks" className="gap-1.5"><Bookmark className="h-4 w-4" /> Bookmarks</TabsTrigger>
          <TabsTrigger value="contributions" className="gap-1.5"><DollarSign className="h-4 w-4" /> Contributions</TabsTrigger>
          <TabsTrigger value="following" className="gap-1.5"><Heart className="h-4 w-4" /> Following</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-4 w-4" /> Notifications
            {unreadCount > 0 && <span className="ml-1 rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-brand-foreground">{unreadCount}</span>}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><SettingsIcon className="h-4 w-4" /> Settings</TabsTrigger>
        </TabsList>

        {/* My Needs */}
        <TabsContent value="needs" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Panel title="Post a need" icon={Plus}>
                <NeedForm categories={categories} onDone={() => setRefreshKey((k) => k + 1)} />
              </Panel>
            </div>
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-20">
                <Panel title={`Your needs (${needs.length})`} icon={Lightbulb}>
                  {dataLoading ? <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div> : needs.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                      No needs yet. Post one to start gathering votes.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {needs.map((n) => (
                        <DashboardNeedRow key={n.id} need={n} onChanged={() => setRefreshKey((k) => k + 1)} />
                      ))}
                    </div>
                  )}
                </Panel>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Bookmarks */}
        <TabsContent value="bookmarks" className="mt-6">
          <Panel title="Bookmarked Software" icon={Bookmark}>
            {dataLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : bookmarks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center">
                <Bookmark className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No bookmarks yet. Browse software and bookmark what interests you.</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/software">Browse Software</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {bookmarks.map((p) => (
                  <ProductListRow key={p.id} product={p} />
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>

        {/* Contributions */}
        <TabsContent value="contributions" className="mt-6">
          <Panel title="Build Reward Contributions" icon={DollarSign}>
            {dataLoading ? (
              <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : contributions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center">
                <DollarSign className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No contributions yet. Contribute to build rewards on needs you care about.</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/search?tab=needs">Browse Needs</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {contributions.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-white p-4 transition hover:border-border hover:shadow-card">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {c.need && (
                        <Link href={`/needs/${c.need.id}`} className="truncate text-sm font-semibold text-foreground hover:text-brand">
                          {c.need.title}
                        </Link>
                      )}
                      <p className="text-xs text-muted-foreground">${Number(c.amount).toFixed(2)} contributed • {formatDate(c.created_at)}</p>
                    </div>
                    {c.note && <span className="text-xs text-muted-foreground italic">{c.note}</span>}
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>

        {/* Following */}
        <TabsContent value="following" className="mt-6">
          <Panel title="Needs You're Following" icon={Heart}>
            {dataLoading ? (
              <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : following.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center">
                <Heart className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Not following any needs yet. Follow needs to get updates.</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/search?tab=needs">Browse Needs</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {following.map((n) => (
                  <Link
                    key={n.id}
                    href={`/needs/${n.id}`}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-white p-4 transition hover:border-border hover:shadow-card"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{n.title}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3 text-brand" /> {formatNumber(n.vote_count)} votes</span>
                        <span className="capitalize">{n.status}</span>
                        {n.reward_amount > 0 && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {Number(n.reward_amount).toLocaleString()}</span>}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-6">
          <Panel title="Notifications" icon={Bell} action={
            unreadCount > 0 ? (
              <Button size="sm" variant="ghost" onClick={markAllRead}>Mark all read</Button>
            ) : undefined
          }>
            {dataLoading ? (
              <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : notifications.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center">
                <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <NotificationRow key={n.id} notification={n} onChanged={() => setRefreshKey((k) => k + 1)} />
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="mt-6">
          <div className="mx-auto max-w-2xl">
            <Panel title="Account Settings" icon={SettingsIcon}>
              {profile ? (
                <>
                  <ProfileForm profile={profile} onDone={() => setRefreshKey((k) => k + 1)} />
                  <div className="mt-6 border-t border-border/60 pt-4 space-y-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/builders/${profile.id}`}>View public profile</Link>
                    </Button>
                    {isBuilder && (
                      <Button asChild variant="outline" size="sm" className="ml-2">
                        <Link href="/dashboard/builder">Builder Dashboard</Link>
                      </Button>
                    )}
                    {profile?.is_admin && (
                      <Button asChild variant="outline" size="sm" className="ml-2">
                        <Link href="/admin">Admin Dashboard</Link>
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Loading profile...</p>
              )}
            </Panel>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  async function markAllRead() {
    if (!user) return;
    const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    if (error) { toast.error('Failed to mark notifications'); return; }
    setRefreshKey((k) => k + 1);
  }
}

function NotificationRow({ notification, onChanged }: { notification: any; onChanged: () => void }) {
  const iconMap: Record<string, typeof Bell> = {
    vote: ArrowUp, contribution: DollarSign, review: Sparkles, follow: Heart, system: Bell,
  };
  const Icon = iconMap[notification.type] ?? Bell;
  const colorMap: Record<string, string> = {
    vote: 'bg-brand/10 text-brand', contribution: 'bg-emerald-50 text-emerald-600',
    review: 'bg-amber-50 text-amber-600', follow: 'bg-pink-50 text-pink-600', system: 'bg-muted/50 text-muted-foreground',
  };

  async function toggleRead() {
    await supabase.from('notifications').update({ read: !notification.read }).eq('id', notification.id);
    onChanged();
  }

  const content = (
    <div className={cn('flex items-center gap-3 rounded-xl border p-4 transition', notification.read ? 'border-border/40 bg-white/50' : 'border-border/60 bg-white hover:shadow-card')}>
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', colorMap[notification.type] ?? colorMap.system)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm', notification.read ? 'text-muted-foreground' : 'font-medium text-foreground')}>{notification.title}</p>
        {notification.body && <p className="text-xs text-muted-foreground">{notification.body}</p>}
        <p className="mt-0.5 text-[11px] text-muted-foreground/70">{formatDate(notification.created_at)}</p>
      </div>
      {!notification.read && <div className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      {notification.link ? (
        <Link href={notification.link} className="flex-1" onClick={toggleRead}>{content}</Link>
      ) : (
        <div className="flex-1">{content}</div>
      )}
      <Button size="sm" variant="ghost" className="shrink-0 text-muted-foreground" onClick={toggleRead}>
        {notification.read ? 'Unread' : 'Read'}
      </Button>
    </div>
  );
}

function DashboardNeedRow({ need, onChanged }: { need: Need; onChanged: () => void }) {
  const [confirming, setConfirming] = useState(false);

  async function del() {
    const { error } = await supabase.from('needs').delete().eq('id', need.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Need deleted');
    onChanged();
  }

  return (
    <div className="rounded-xl border border-border/60 bg-white p-4 transition hover:border-border hover:shadow-card">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/needs/${need.id}`} className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground hover:text-brand">{need.title}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><ArrowUp className="h-3 w-3 text-brand" /> {formatNumber(need.vote_count)} votes</span>
            <span className="capitalize">{need.status}</span>
          </div>
        </Link>
        {confirming ? (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="destructive" onClick={del}>Delete</Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
          </div>
        ) : (
          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setConfirming(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ProductListRow({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex items-center gap-3 rounded-xl border border-border/60 bg-white p-3 transition hover:border-border hover:shadow-card"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand/15 to-brand/5 text-[11px] font-bold text-brand">
        {product.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground group-hover:text-brand">{product.name}</p>
        <p className="truncate text-xs text-muted-foreground">{product.tagline}</p>
      </div>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-brand" />
    </Link>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Lightbulb; label: string; value: number | string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/60 bg-white p-5 shadow-card transition hover:shadow-card-hover"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" /> <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2.5 font-display text-2xl font-bold text-foreground">{value}</p>
    </motion.div>
  );
}

function QuickAction({ icon: Icon, label, href, highlight }: { icon: typeof Package; label: string; href: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-card-hover',
        highlight
          ? 'border-brand/20 bg-brand/5 hover:border-brand/30'
          : 'border-border/60 bg-white hover:border-border'
      )}
    >
      <div className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
        highlight ? 'bg-brand text-brand-foreground' : 'bg-muted/60 text-muted-foreground'
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <span className={cn('text-sm font-semibold', highlight ? 'text-brand' : 'text-foreground')}>{label}</span>
      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

function Panel({ title, icon: Icon, action, children }: { title: string; icon: typeof Lightbulb; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-card sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <Icon className="h-4 w-4 text-brand" /> {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10"><Skeleton className="h-24 w-full rounded-2xl" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
