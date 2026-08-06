'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import type { Category, Need, Product, ActivityFeedItem, Review } from '@/lib/types';
import { ProductForm } from '@/components/forms/product-form';
import { ProfileForm } from '@/components/forms/profile-form';
import { PayProductButton } from '@/components/forms/pay-product-button';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { OpportunityFeed } from '@/components/opportunity-feed';
import { ProductImage } from '@/components/product-image';
import { VerifiedBadge } from '@/components/verified-badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  Lightbulb, Package, User, Plus, ArrowUp, Star, LogIn, Sparkles,
  AlertCircle, CheckCircle2, Eye, Bookmark, BarChart3, Target,
  ArrowRight, Search, Rocket, TrendingUp, ExternalLink, Crown,
  Link2, Zap, Activity as ActivityIcon, Hammer, DollarSign,
  CreditCard, Receipt, Calendar, ShieldCheck, Gauge, Award, MessageSquare, Compass,
} from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/format';
import { getNeedScoreLevel, getNeedScoreColor, getNeedScoreBg } from '@/lib/needscore';
import { cn } from '@/lib/utils';

const VALID_TABS = ['overview', 'software', 'analytics', 'opportunities', 'needscore', 'reviews', 'payments', 'pro', 'settings'] as const;
type TabKey = (typeof VALID_TABS)[number];

/* ------------------------------------------------------------------ */
/*  Main content                                                       */
/* ------------------------------------------------------------------ */

function BuilderDashboardContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();

  const tabParam = params.get('tab') as TabKey | null;
  const initialTab = VALID_TABS.includes(tabParam as TabKey) ? (tabParam as TabKey) : 'overview';

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activity, setActivity] = useState<ActivityFeedItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
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

    const [p, a] = await Promise.all([
      supabase
        .from('products')
        .select(`*, category:categories(*)`)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('activity_feed')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(15),
    ]);

    const productList = (p.data as Product[]) ?? [];
    setProducts(productList);
    setActivity((a.data as ActivityFeedItem[]) ?? []);

    // Reviews joined to the builder's products
    const productIds = productList.map((pr) => pr.id);
    if (productIds.length > 0) {
      const { data: reviewData } = await supabase
        .from('reviews')
        .select(`*, profile:profiles(*)`)
        .in('product_id', productIds)
        .order('created_at', { ascending: false })
        .limit(50);
      setReviews((reviewData as Review[]) ?? []);
    } else {
      setReviews([]);
    }

    setDataLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData, refreshKey]);

  // Handle payment redirect feedback
  useEffect(() => {
    if (params.get('cancel') === '1') {
      toast.error('Payment was cancelled. Your software is saved as unpaid — you can retry anytime.');
      router.replace('/dashboard/builder?tab=software');
    }
    if (params.get('pro') === '1') {
      toast.success('Welcome to Pro Builder! All features are now unlocked.');
      router.replace('/dashboard/builder?tab=pro');
    }
  }, [params, router]);

  function setTab(t: string) {
    const sp = new URLSearchParams(params.toString());
    if (t === 'overview') sp.delete('tab');
    else sp.set('tab', t);
    router.replace(`/dashboard/builder?${sp.toString()}`);
  }

  /* ---- loading ---- */
  if (authLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="mb-8 h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  /* ---- not signed in ---- */
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground">
          <LogIn className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Sign in to your builder dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You need an account to list software, track analytics, and manage your builder profile.
        </p>
        <Button asChild className="mt-6 bg-brand text-brand-foreground hover:bg-brand/90">
          <Link href="/signin?tab=signup">Create an account</Link>
        </Button>
      </div>
    );
  }

  /* ---- not onboarded: CTA ---- */
  if (!profile?.builder_onboarded) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border/60 bg-white p-8 shadow-card sm:p-10"
        >
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/15 to-brand/5 text-brand ring-1 ring-brand/15">
            <Hammer className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Become a Builder
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            The Builder Dashboard is your command center for publishing software, tracking performance,
            finding opportunities, and growing your reputation. Complete a quick onboarding to unlock it.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link href="/onboarding/builder">
                <Hammer className="mr-2 h-4 w-4" /> Start builder onboarding
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/dashboard">Back to user dashboard</Link>
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
            <OnboardPerk icon={Package} title="Publish software" desc="List your products and reach buyers." />
            <OnboardPerk icon={BarChart3} title="Track analytics" desc="Views, bookmarks, reviews & traffic." />
            <OnboardPerk icon={Compass} title="Find opportunities" desc="Validated needs matched to you." />
          </div>
        </motion.div>
      </div>
    );
  }

  /* ---- stats ---- */
  const publishedProducts = products.filter((p) => p.paid).length;
  const totalViews = products.reduce((s, p) => s + p.view_count, 0);
  const totalReviews = products.reduce((s, p) => s + p.review_count, 0);
  const totalBookmarks = products.reduce((s, p) => s + p.bookmark_count, 0);
  const ratedProducts = products.filter((p) => p.review_count > 0);
  const avgRating = ratedProducts.length > 0
    ? ratedProducts.reduce((s, p) => s + p.avg_rating, 0) / ratedProducts.length
    : 0;

  const firstName = profile?.full_name?.split(' ')[0] ?? profile?.username ?? 'there';
  const isPro = profile?.pro_builder;

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      {/* Welcome */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Builder Dashboard
            </h1>
            {isPro && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-0.5 text-xs font-medium text-brand-foreground">
                <Crown className="h-3 w-3" /> Pro
              </span>
            )}
            {profile?.verified && <VerifiedBadge showLabel />}
          </div>
          <p className="mt-1.5 text-muted-foreground">
            Welcome back, {firstName}. Here&apos;s how your software is performing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isPro && (
            <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link href="/pricing"><Rocket className="mr-2 h-4 w-4" /> Upgrade to Pro</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={Package} label="Software" value={products.length} />
        <StatCard icon={CheckCircle2} label="Published" value={publishedProducts} />
        <StatCard icon={Eye} label="Total Views" value={formatNumber(totalViews)} />
        <StatCard icon={Star} label="Reviews" value={totalReviews} />
        <StatCard
          icon={Star}
          label="Avg Rating"
          value={avgRating > 0 ? avgRating.toFixed(1) : '—'}
          iconClass="fill-amber-400 text-amber-400"
        />
        <StatCard icon={Bookmark} label="Bookmarks" value={formatNumber(totalBookmarks)} />
      </div>

      {/* Quick actions */}
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <QuickAction icon={Package} label="List Software" href="/dashboard/builder?tab=software" />
        <QuickAction icon={Search} label="Browse Needs" href="/search?tab=needs" />
        <QuickAction icon={Compass} label="Opportunities" href="/dashboard/builder?tab=opportunities" />
        <QuickAction
          icon={isPro ? BarChart3 : Rocket}
          label={isPro ? 'View Analytics' : 'Upgrade to Pro'}
          href={isPro ? '/dashboard/builder?tab=analytics' : '/pricing'}
          highlight={!isPro}
        />
      </div>

      <Tabs value={initialTab} onValueChange={setTab}>
        <TabsList className="flex-wrap bg-white border border-border/60 shadow-card">
          <TabsTrigger value="overview" className="gap-1.5"><Sparkles className="h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="software" className="gap-1.5"><Package className="h-4 w-4" /> Software</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Analytics</TabsTrigger>
          <TabsTrigger value="opportunities" className="gap-1.5"><Compass className="h-4 w-4" /> Opportunities</TabsTrigger>
          <TabsTrigger value="needscore" className="gap-1.5"><Gauge className="h-4 w-4" /> NeedScore™</TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1.5"><MessageSquare className="h-4 w-4" /> Reviews</TabsTrigger>
          <TabsTrigger value="payments" className="gap-1.5"><Receipt className="h-4 w-4" /> Payments</TabsTrigger>
          <TabsTrigger value="pro" className="gap-1.5"><Crown className="h-4 w-4" /> Pro Builder</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5"><User className="h-4 w-4" /> Settings</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel
              title="Recent software"
              icon={Package}
              action={
                <Button size="sm" variant="ghost" onClick={() => setTab('software')}>
                  <Plus className="mr-1 h-3.5 w-3.5" /> New
                </Button>
              }
            >
              {dataLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : products.length === 0 ? (
                <EmptyMini
                  text="No software yet. List your first product."
                  onAction={() => setTab('software')}
                  actionLabel="List software"
                />
              ) : (
                <div className="space-y-2">
                  {products.slice(0, 4).map((p) => (
                    <ProductListRow key={p.id} product={p} showStatus />
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Recent activity" icon={ActivityIcon}>
              {activity.length > 0 ? (
                <div className="space-y-2">
                  {activity.map((item) => (
                    <ActivityRow key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No activity yet. Start by listing software or posting a need.
                </p>
              )}
            </Panel>
          </div>

          {/* Reviews preview */}
          <Panel
            title="Latest reviews"
            icon={MessageSquare}
            action={
              reviews.length > 0 ? (
                <Button size="sm" variant="ghost" onClick={() => setTab('reviews')}>
                  View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              ) : undefined
            }
          >
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.slice(0, 3).map((r) => (
                  <ReviewRow key={r.id} review={r} products={products} compact />
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No reviews yet. Once people try your software, reviews will show up here.
              </p>
            )}
          </Panel>
        </TabsContent>

        {/* Software */}
        <TabsContent value="software" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <Panel title="List new software" icon={Plus}>
                <ProductForm categories={categories} onDone={() => setRefreshKey((k) => k + 1)} />
              </Panel>
            </div>
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-20">
                <Panel title={`Your software (${products.length})`} icon={Package}>
                  {dataLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : products.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                      No software yet. List your first product to start getting traffic.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {products.map((p) => (
                        <div key={p.id} className="space-y-2">
                          <ProductListRow product={p} showStatus />
                          {!p.paid && (
                            <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-50 p-2.5">
                              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                              <p className="flex-1 text-xs text-amber-700">
                                Not published — complete payment to list.
                              </p>
                              <PayProductButton product={p} onPaid={() => setRefreshKey((k) => k + 1)} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="mt-6">
          <Panel title="Advanced Analytics" icon={BarChart3}>
            <AnalyticsDashboard />
          </Panel>
        </TabsContent>

        {/* Opportunities */}
        <TabsContent value="opportunities" className="mt-6">
          <Panel title="Opportunity Feed" icon={Compass}>
            <OpportunityFeed />
          </Panel>
        </TabsContent>

        {/* NeedScore */}
        <TabsContent value="needscore" className="mt-6">
          <NeedScorePanel products={products} />
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews" className="mt-6">
          <Panel title={`Reviews on your software (${reviews.length})`} icon={MessageSquare}>
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((r) => (
                  <ReviewRow key={r.id} review={r} products={products} />
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                No reviews yet. Reviews appear here as soon as someone rates your software.
              </p>
            )}
          </Panel>
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments" className="mt-6">
          <PaymentsPanel userId={user.id} />
        </TabsContent>

        {/* Pro Builder */}
        <TabsContent value="pro" className="mt-6">
          <ProBuilderPanel profile={profile} />
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="mt-6">
          <div className="mx-auto max-w-2xl">
            <Panel title="Builder profile" icon={User}>
              {profile ? (
                <>
                  <ProfileForm
                    profile={profile}
                    onDone={() => {
                      setRefreshKey((k) => k + 1);
                      refreshProfile();
                    }}
                  />
                  <div className="mt-6 border-t border-border/60 pt-4">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/builders/${profile.id}`}>
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View public profile
                      </Link>
                    </Button>
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
}

/* ------------------------------------------------------------------ */
/*  NeedScore panel                                                    */
/* ------------------------------------------------------------------ */

function NeedScorePanel({ products }: { products: Product[] }) {
  const { user } = useAuth();
  const [matched, setMatched] = useState<Need[]>([]);
  const [trending, setTrending] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);

      // Builder's unique category ids
      const categoryIds = Array.from(
        new Set(products.map((p) => p.category_id).filter(Boolean) as string[])
      );

      // Needs in the builder's categories (matched needs)
      let matchedNeeds: Need[] = [];
      if (categoryIds.length > 0) {
        const { data } = await supabase
          .from('needs')
          .select(`*, category:categories(*)`)
          .in('category_id', categoryIds)
          .neq('status', 'closed')
          .order('need_score', { ascending: false })
          .limit(20);
        matchedNeeds = (data as Need[]) ?? [];
      }
      setMatched(matchedNeeds);

      // Trending needs in those categories (highest vote growth / recent)
      if (categoryIds.length > 0) {
        const { data } = await supabase
          .from('needs')
          .select(`*, category:categories(*)`)
          .in('category_id', categoryIds)
          .eq('status', 'open')
          .order('vote_count', { ascending: false })
          .limit(8);
        setTrending((data as Need[]) ?? []);
      } else {
        setTrending([]);
      }

      setLoading(false);
    }
    load();
  }, [user, products]);

  return (
    <div className="space-y-6">
      {/* Explanation */}
      <div className="rounded-2xl border border-brand/20 bg-gradient-to-b from-brand/5 to-transparent p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">What is NeedScore™?</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              NeedScore™ is a 0–100 rating that ranks how urgent and validated a market need is. It blends
              community votes, reward contributions, growth velocity, and engagement to surface the needs
              most worth building. The higher the score, the stronger the signal — and the better the
              product–market fit opportunity for a builder like you.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <ScoreLegend color="bg-emerald-500" label="Very High (75+)" />
              <ScoreLegend color="bg-sky-500" label="High (50–74)" />
              <ScoreLegend color="bg-amber-500" label="Medium (25–49)" />
              <ScoreLegend color="bg-muted-foreground/40" label="Low (0–24)" />
            </div>
          </div>
        </div>
      </div>

      {products.length === 0 && (
        <Panel title="Needs matched to your products" icon={Link2}>
          <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            List software and assign it a category to see needs that match what you build.
          </p>
        </Panel>
      )}

      {/* Matched needs */}
      {products.length > 0 && (
        <Panel
          title="Needs matched to your products"
          icon={Link2}
          action={
            <Button asChild size="sm" variant="ghost">
              <Link href="/search?tab=needs">Browse all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          }
        >
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : matched.length > 0 ? (
            <div className="space-y-2">
              {matched.map((n) => (
                <NeedScoreRow key={n.id} need={n} />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No open needs in your product categories yet. Check back as the community posts more.
            </p>
          )}
        </Panel>
      )}

      {/* Trending needs in builder categories */}
      {products.length > 0 && (
        <Panel title="Trending in your categories" icon={TrendingUp}>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : trending.length > 0 ? (
            <div className="space-y-2">
              {trending.map((n) => (
                <NeedScoreRow key={n.id} need={n} />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Nothing trending in your categories right now.
            </p>
          )}
        </Panel>
      )}
    </div>
  );
}

function NeedScoreRow({ need }: { need: Need }) {
  return (
    <Link
      href={`/needs/${need.id}`}
      className="flex items-center gap-4 rounded-xl border border-border/60 bg-white p-3.5 transition hover:border-border hover:shadow-card"
    >
      <ScoreBadge score={need.need_score} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{need.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ArrowUp className="h-3 w-3 text-brand" /> {formatNumber(need.vote_count)} votes
          </span>
          <span className="capitalize">{need.status}</span>
          {need.category?.name && <span>{need.category.name}</span>}
          <span>{formatDate(need.created_at)}</span>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/40 font-display text-lg font-bold text-foreground">
        {Math.round(score)}
      </div>
      <span className={cn('mt-1 text-[10px] font-semibold uppercase tracking-wide', getNeedScoreColor(score))}>
        {getNeedScoreLevel(score)}
      </span>
    </div>
  );
}

function ScoreLegend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-muted-foreground">
      <span className={cn('h-2.5 w-2.5 rounded-full', color)} />
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Payments panel                                                     */
/* ------------------------------------------------------------------ */

type StripeOrder = {
  order_id: number;
  customer_id: string;
  checkout_session_id: string | null;
  payment_intent_id: string | null;
  amount_total: number | null;
  currency: string | null;
  payment_status: string | null;
  order_status: string | null;
  order_date: string;
};

type StripeSubscription = {
  subscription_id: string;
  customer_id: string;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
};

function PaymentsPanel({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<StripeOrder[]>([]);
  const [subscriptions, setSubscriptions] = useState<StripeSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Map user -> stripe customer id(s)
        const { data: customers } = await supabase
          .from('stripe_customers')
          .select('customer_id')
          .eq('user_id', userId);

        const customerIds = (customers ?? []).map((c: any) => c.customer_id).filter(Boolean);
        if (customerIds.length === 0) {
          setOrders([]);
          setSubscriptions([]);
          setLoading(false);
          return;
        }

        const [o, s] = await Promise.all([
          supabase
            .from('stripe_user_orders')
            .select('*')
            .in('customer_id', customerIds)
            .order('order_date', { ascending: false })
            .limit(50),
          supabase
            .from('stripe_user_subscriptions')
            .select('*')
            .in('customer_id', customerIds)
            .order('current_period_end', { ascending: false }),
        ]);

        setOrders((o.data as StripeOrder[]) ?? []);
        setSubscriptions((s.data as StripeSubscription[]) ?? []);
      } catch {
        setOrders([]);
        setSubscriptions([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const totalSpent = orders.reduce(
    (sum, o) => sum + (o.payment_status === 'paid' && o.amount_total ? o.amount_total : 0),
    0
  );
  const activeSubs = subscriptions.filter((s) =>
    ['active', 'trialing'].includes(s.subscription_status)
  );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={DollarSign} label="Total spent" value={formatMoney(totalSpent)} />
        <StatCard icon={Receipt} label="Orders" value={orders.length} />
        <StatCard icon={CreditCard} label="Active subs" value={activeSubs.length} />
      </div>

      {/* Subscriptions */}
      <Panel title="Subscriptions" icon={CreditCard}>
        {subscriptions.length > 0 ? (
          <div className="space-y-3">
            {subscriptions.map((s) => (
              <SubscriptionRow key={s.subscription_id} sub={s} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CreditCard}
            title="No subscriptions"
            text="You don't have any active subscriptions. Upgrade to Pro Builder to unlock premium features."
            actionLabel="View pricing"
            actionHref="/pricing"
          />
        )}
      </Panel>

      {/* Orders */}
      <Panel title="Order history" icon={Receipt}>
        {orders.length > 0 ? (
          <div className="space-y-2">
            {orders.map((o) => (
              <OrderRow key={o.order_id} order={o} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Receipt}
            title="No orders yet"
            text="Your payment history will appear here once you make a purchase — like listing a product or upgrading to Pro."
            actionLabel="List software"
            actionHref="/dashboard/builder?tab=software"
          />
        )}
      </Panel>
    </div>
  );
}

function SubscriptionRow({ sub }: { sub: StripeSubscription }) {
  const active = ['active', 'trialing'].includes(sub.subscription_status);
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold capitalize text-foreground">
            {sub.subscription_status}
          </p>
          <Badge
            variant="outline"
            className={cn(
              'border-0 text-xs font-normal',
              active ? 'bg-emerald-50 text-emerald-600' : 'bg-muted text-muted-foreground'
            )}
          >
            {active ? 'Active' : 'Inactive'}
          </Badge>
          {sub.cancel_at_period_end && (
            <Badge variant="outline" className="border-0 bg-amber-50 text-xs font-normal text-amber-600">
              Cancels at period end
            </Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {periodEnd ? `Renews ${formatDate(periodEnd.toISOString())}` : '—'}
          </span>
          {sub.payment_method_brand && (
            <span className="capitalize">
              {sub.payment_method_brand}
              {sub.payment_method_last4 ? ` •••• ${sub.payment_method_last4}` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order }: { order: StripeOrder }) {
  const paid = order.payment_status === 'paid';
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-white p-3.5 transition hover:border-border hover:shadow-card">
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          paid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
        )}
      >
        <Receipt className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          {order.amount_total != null ? formatMoney(order.amount_total) : '—'}
          <span className="ml-1 text-xs font-normal text-muted-foreground uppercase">
            {order.currency ?? 'usd'}
          </span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {order.order_date ? formatDate(order.order_date) : '—'}
        </p>
      </div>
      <Badge
        variant="outline"
        className={cn(
          'border-0 text-xs font-normal capitalize',
          paid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
        )}
      >
        {order.payment_status ?? 'unknown'}
      </Badge>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pro Builder panel                                                  */
/* ------------------------------------------------------------------ */

const PRO_FEATURES: { icon: typeof Crown; title: string; desc: string }[] = [
  { icon: Package, title: 'Unlimited software listings', desc: 'Publish as many products as you want with no $10 listing fee.' },
  { icon: BarChart3, title: 'Advanced analytics', desc: 'Detailed views, unique visitors, traffic sources and growth rates.' },
  { icon: Compass, title: 'Opportunity feed', desc: 'A personalized feed of validated needs ranked for your expertise.' },
  { icon: Gauge, title: 'NeedScore™ insights', desc: 'See the highest-signal needs matched to your categories.' },
  { icon: Award, title: 'Pro badge & ranking boost', desc: 'Stand out with a Pro badge and higher placement in search.' },
  { icon: ShieldCheck, title: 'Priority support', desc: 'Fast-track responses and priority review of your listings.' },
];

function ProBuilderPanel({ profile }: { profile: any }) {
  const isPro = profile?.pro_builder;
  const since = profile?.pro_builder_since ? formatDate(profile.pro_builder_since) : null;

  if (isPro) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-brand/20 bg-gradient-to-b from-brand/10 to-transparent p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-brand-foreground ring-1 ring-brand/20">
              <Crown className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">Pro Builder</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                You&apos;re a Pro Builder{since ? ` since ${since}` : ''}. All premium features are unlocked.
              </p>
            </div>
          </div>
        </div>

        <Panel title="Your Pro benefits" icon={Sparkles}>
          <div className="grid gap-4 sm:grid-cols-2">
            {PRO_FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-white p-4"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <f.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand/20 bg-gradient-to-b from-brand/5 to-transparent p-6 text-center sm:p-10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand ring-1 ring-brand/15">
          <Crown className="h-7 w-7" />
        </div>
        <h2 className="font-display text-2xl font-semibold text-foreground">Upgrade to Pro Builder</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Unlock unlimited listings, advanced analytics, a personalized opportunity feed, and a Pro badge
          that helps you stand out.
        </p>
        <Button asChild size="lg" className="mt-6 bg-brand text-brand-foreground hover:bg-brand/90">
          <Link href="/pricing"><Rocket className="mr-2 h-4 w-4" /> View pricing & upgrade</Link>
        </Button>
      </div>

      <Panel title="What you get with Pro" icon={Sparkles}>
        <div className="grid gap-4 sm:grid-cols-2">
          {PRO_FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-white p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                <f.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{f.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Feature comparison */}
        <div className="mt-6 overflow-hidden rounded-xl border border-border/60">
          <div className="grid grid-cols-3 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <div className="p-3">Feature</div>
            <div className="p-3 text-center">Free</div>
            <div className="p-3 text-center text-brand">Pro</div>
          </div>
          {[
            ['Software listings', '1 free, then $10 each', 'Unlimited'],
            ['Analytics', 'Basic stats', 'Full dashboards'],
            ['Opportunity feed', '—', 'Personalized'],
            ['NeedScore™ matching', '—', 'Enabled'],
            ['Pro badge', '—', '✓'],
            ['Priority support', 'Standard', 'Priority'],
          ].map(([feature, free, pro]) => (
            <div key={feature} className="grid grid-cols-3 border-t border-border/60 text-sm">
              <div className="p-3 font-medium text-foreground">{feature}</div>
              <div className="p-3 text-center text-muted-foreground">{free}</div>
              <div className="p-3 text-center font-medium text-brand">{pro}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared presentational components                                   */
/* ------------------------------------------------------------------ */

function Panel({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: typeof Lightbulb;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
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

function StatCard({
  icon: Icon,
  label,
  value,
  iconClass,
}: {
  icon: typeof Lightbulb;
  label: string;
  value: number | string;
  iconClass?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/60 bg-white p-5 shadow-card transition hover:shadow-card-hover"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={cn('h-4 w-4', iconClass)} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2.5 font-display text-2xl font-bold text-foreground">{value}</p>
    </motion.div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
  highlight,
}: {
  icon: typeof Package;
  label: string;
  href: string;
  highlight?: boolean;
}) {
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
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          highlight ? 'bg-brand text-brand-foreground' : 'bg-muted/60 text-muted-foreground'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span className={cn('text-sm font-semibold', highlight ? 'text-brand' : 'text-foreground')}>
        {label}
      </span>
      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

function ProductListRow({ product, showStatus }: { product: Product; showStatus?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-white p-3 transition hover:border-border hover:shadow-card">
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted/30">
        {product.logo_url ? (
          <ProductImage
            path={product.logo_url}
            alt={`${product.name} logo`}
            fill
            sizes="40px"
            fallback={<LogoFallback name={product.name} size="h-10 w-10" />}
          />
        ) : (
          <LogoFallback name={product.name} size="h-10 w-10" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{product.name}</p>
        <p className="truncate text-xs text-muted-foreground">{product.tagline}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          {product.review_count > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {Number(product.avg_rating).toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" /> {product.view_count}
          </span>
          <span className="flex items-center gap-1">
            <Bookmark className="h-3 w-3" /> {product.bookmark_count}
          </span>
          {showStatus &&
            (product.paid ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Published
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600">
                <AlertCircle className="h-3 w-3" /> Unpaid
              </span>
            ))}
        </div>
      </div>
      <Button asChild size="sm" variant="ghost" className="shrink-0 text-muted-foreground hover:text-foreground">
        <Link href={`/products/${product.id}`}>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}

function ReviewRow({
  review,
  products,
  compact,
}: {
  review: Review;
  products: Product[];
  compact?: boolean;
}) {
  const product = products.find((p) => p.id === review.product_id);
  const initials = (review.profile?.full_name || review.profile?.username || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="rounded-xl border border-border/60 bg-white p-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-muted/60 text-xs font-semibold text-muted-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground">
                {review.profile?.full_name || review.profile?.username || 'Anonymous'}
              </p>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-3 w-3',
                      i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
                    )}
                  />
                ))}
              </div>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
          </div>
          {product && (
            <Link
              href={`/products/${product.id}`}
              className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-brand"
            >
              <Package className="h-3 w-3" /> {product.name}
            </Link>
          )}
          {review.title && <p className="mt-1.5 text-sm font-medium text-foreground">{review.title}</p>}
          {!compact && review.body && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{review.body}</p>
          )}
          {compact && review.body && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{review.body}</p>
          )}
        </div>
      </div>
    </div>
  );
}

const ACTIVITY_CONFIG: Record<string, { icon: typeof Eye; color: string }> = {
  bookmark: { icon: Bookmark, color: 'bg-blue-50 text-blue-600' },
  review: { icon: Star, color: 'bg-amber-50 text-amber-600' },
  view: { icon: Eye, color: 'bg-sky-50 text-sky-600' },
  need_match: { icon: Link2, color: 'bg-emerald-50 text-emerald-600' },
  builder_committed: { icon: Hammer, color: 'bg-violet-50 text-violet-600' },
  product_published: { icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
  contribution: { icon: DollarSign, color: 'bg-emerald-50 text-emerald-600' },
  vote: { icon: ArrowUp, color: 'bg-brand/10 text-brand' },
};

function formatActivityTitle(item: ActivityFeedItem): string {
  const m = item.metadata ?? {};
  switch (item.type) {
    case 'bookmark':
      return `${m.username ?? 'Someone'} bookmarked your software${m.product_name ? ` "${m.product_name}"` : ''}`;
    case 'review':
      return `${m.username ?? 'Someone'} reviewed your software${m.product_name ? ` "${m.product_name}"` : ''} — ${m.rating ?? 5}★`;
    case 'view':
      return `Your ${item.entity_type} gained ${m.count ?? 'a'} view${m.count > 1 ? 's' : ''}`;
    case 'need_match':
      return `Your software${m.product_name ? ` "${m.product_name}"` : ''} matched a need${m.need_title ? ` "${m.need_title}"` : ''}`;
    case 'builder_committed':
      return `${m.username ?? 'A builder'} committed to your need${m.need_title ? ` "${m.need_title}"` : ''}`;
    case 'product_published':
      return `${m.product_name ?? 'Your software'} is now published`;
    case 'contribution':
      return `${m.username ?? 'Someone'} contributed $${m.amount ?? 0} to your need${m.need_title ? ` "${m.need_title}"` : ''}`;
    case 'vote':
      return `${m.username ?? 'Someone'} voted on your need${m.need_title ? ` "${m.need_title}"` : ''}`;
    default:
      return item.type.replace(/_/g, ' ');
  }
}

function ActivityRow({ item }: { item: ActivityFeedItem }) {
  const config = ACTIVITY_CONFIG[item.type] ?? { icon: ActivityIcon, color: 'bg-muted/50 text-muted-foreground' };
  const Icon = config.icon;
  const title = formatActivityTitle(item);
  const href =
    item.entity_type === 'product'
      ? `/products/${item.entity_id}`
      : item.entity_type === 'need'
        ? `/needs/${item.entity_id}`
        : item.entity_type === 'builder'
          ? `/builders/${item.entity_id}`
          : '#';

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-border/60 bg-white p-3.5 transition hover:border-border hover:shadow-card"
    >
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', config.color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
      </div>
    </Link>
  );
}

function EmptyMini({ text, onAction, actionLabel }: { text: string; onAction: () => void; actionLabel: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Button size="sm" variant="outline" className="mt-3" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
  actionLabel,
  actionHref,
}: {
  icon: typeof Eye;
  title: string;
  text: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-white px-4 py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground/60">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{text}</p>
      {actionLabel && actionHref && (
        <Button asChild size="sm" variant="outline" className="mt-4">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}

function OnboardPerk({ icon: Icon, title, desc }: { icon: typeof Package; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-white p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2.5 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function LogoFallback({ name, size }: { name: string; size: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg bg-gradient-to-br from-brand/15 to-brand/5 text-[11px] font-bold text-brand',
        size
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function formatMoney(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

/* ------------------------------------------------------------------ */
/*  Page export (Suspense boundary for useSearchParams)                */
/* ------------------------------------------------------------------ */

export default function BuilderDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      }
    >
      <BuilderDashboardContent />
    </Suspense>
  );
}
