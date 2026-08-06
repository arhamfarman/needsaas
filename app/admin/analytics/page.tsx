import { supabase } from '@/lib/supabase';
// No framer-motion — this is a server component
import Link from 'next/link';
import {
  Users,
  Crown,
  UserPlus,
  Package,
  Lightbulb,
  FileText,
  Star,
  DollarSign,
  Search,
  TrendingUp,
  ArrowRight,
  Activity,
} from 'lucide-react';

export const metadata = { title: 'Analytics' };

type StatCard = {
  label: string;
  value: string;
  icon: typeof Users;
  color: string;
  href?: string;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function AnalyticsPage() {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // --- User stats ---
  const [totalUsers, proBuilders, newUsersThisMonth] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('pro_builder', true),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstOfMonth),
  ]);

  // --- Content stats ---
  const [publishedProducts, totalNeeds, publishedPosts, totalReviews] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('paid', true),
    supabase.from('needs').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
  ]);

  // --- Reward stats ---
  const { data: rewardRows } = await supabase
    .from('needs')
    .select('reward_amount')
    .gt('reward_amount', 0);

  const totalRewardAmount = (rewardRows ?? []).reduce((s, r) => s + Number(r.reward_amount), 0);
  const rewardedNeedCount = rewardRows?.length ?? 0;
  const avgReward = rewardedNeedCount > 0 ? totalRewardAmount / rewardedNeedCount : 0;

  // --- Top categories by product count ---
  const { data: productCategoryIds } = await supabase
    .from('products')
    .select('category_id');

  const categoryCountMap = new Map<string, number>();
  for (const row of productCategoryIds ?? []) {
    const cid = (row as { category_id: string | null }).category_id;
    if (cid) categoryCountMap.set(cid, (categoryCountMap.get(cid) ?? 0) + 1);
  }

  const topCategoryIds = Array.from(categoryCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  let topCategories: { id: string; name: string; count: number }[] = [];
  if (topCategoryIds.length > 0) {
    const { data: cats } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', topCategoryIds);
    topCategories = (cats ?? [])
      .map((c) => ({
        id: c.id,
        name: c.name,
        count: categoryCountMap.get(c.id) ?? 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  // --- Top searches ---
  const { data: searchLogs } = await supabase
    .from('search_log')
    .select('query, tab, result_count, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  const searchAgg = new Map<string, { count: number; lastSeen: string }>();
  for (const log of searchLogs ?? []) {
    const q = (log as { query: string; created_at: string }).query?.trim();
    if (!q) continue;
    const existing = searchAgg.get(q);
    if (existing) {
      existing.count += 1;
      if (log.created_at > existing.lastSeen) existing.lastSeen = log.created_at;
    } else {
      searchAgg.set(q, { count: 1, lastSeen: log.created_at });
    }
  }

  const topSearches = Array.from(searchAgg.entries())
    .map(([query, { count, lastSeen }]) => ({ query, count, lastSeen }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // --- Blog performance ---
  const [publishedPostCount, postsThisMonth] = await Promise.all([
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq('published', true)
      .gte('published_at', firstOfMonth),
  ]);

  // --- Recent activity ---
  const [recentProducts, recentNeeds] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('needs')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  // --- Stat cards ---
  const userCards: StatCard[] = [
    { label: 'Total Users', value: (totalUsers.count ?? 0).toLocaleString(), icon: Users, color: 'text-blue-600 bg-blue-50', href: '/admin/users' },
    { label: 'Pro Builders', value: (proBuilders.count ?? 0).toLocaleString(), icon: Crown, color: 'text-orange-600 bg-orange-50', href: '/admin/builders' },
    { label: 'New This Month', value: (newUsersThisMonth.count ?? 0).toLocaleString(), icon: UserPlus, color: 'text-emerald-600 bg-emerald-50' },
  ];

  const contentCards: StatCard[] = [
    { label: 'Published Software', value: (publishedProducts.count ?? 0).toLocaleString(), icon: Package, color: 'text-emerald-600 bg-emerald-50', href: '/admin/software' },
    { label: 'Total Needs', value: (totalNeeds.count ?? 0).toLocaleString(), icon: Lightbulb, color: 'text-amber-600 bg-amber-50', href: '/admin/needs' },
    { label: 'Blog Posts', value: (publishedPosts.count ?? 0).toLocaleString(), icon: FileText, color: 'text-cyan-600 bg-cyan-50', href: '/admin/blog' },
    { label: 'Reviews', value: (totalReviews.count ?? 0).toLocaleString(), icon: Star, color: 'text-purple-600 bg-purple-50', href: '/admin/reviews' },
  ];

  const rewardCards: StatCard[] = [
    { label: 'Total Reward Pool', value: `$${totalRewardAmount.toLocaleString()}`, icon: DollarSign, color: 'text-green-600 bg-green-50', href: '/admin/rewards' },
    { label: 'Avg Reward / Need', value: `$${avgReward.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-teal-600 bg-teal-50' },
  ];

  const maxCatCount = topCategories.length > 0 ? topCategories[0].count : 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform-wide metrics and trends.
        </p>
      </div>

      {/* Users section */}
      <section className="mb-8">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Users
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {userCards.map((card, i) => (
            <div key={card.label}>
              <StatCardView card={card} />
            </div>
          ))}
        </div>
      </section>

      {/* Content section */}
      <section className="mb-8">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Content
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contentCards.map((card, i) => (
            <div key={card.label}>
              <StatCardView card={card} />
            </div>
          ))}
        </div>
      </section>

      {/* Rewards section */}
      <section className="mb-8">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Rewards
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {rewardCards.map((card, i) => (
            <div key={card.label}>
              <StatCardView card={card} />
            </div>
          ))}
        </div>
      </section>

      {/* Two-column: Top categories + Top searches */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Top categories */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <Package className="h-5 w-5 text-brand" /> Top Categories
          </h2>
          {topCategories.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No categorized products yet.
            </p>
          ) : (
            <div className="space-y-3">
              {topCategories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3">
                  <Link
                    href={`/categories/${cat.id}`}
                    className="w-32 shrink-0 truncate text-sm font-medium text-foreground hover:underline"
                  >
                    {cat.name}
                  </Link>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${(cat.count / maxCatCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top searches */}
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <Search className="h-5 w-5 text-brand" /> Top Searches
          </h2>
          {topSearches.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No search activity logged yet.
            </p>
          ) : (
            <ol className="space-y-2">
              {topSearches.map((s, i) => (
                <li
                  key={s.query + i}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/40 px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand/10 text-xs font-semibold text-brand">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm text-foreground">{s.query}</span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                    {s.count}×
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Blog performance */}
      <section className="mb-8">
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Blog Performance
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
              <FileText className="h-5 w-5" />
            </div>
            <p className="font-display text-2xl font-bold text-foreground">
              {(publishedPostCount.count ?? 0).toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Published posts</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className="font-display text-2xl font-bold text-foreground">
              {(postsThisMonth.count ?? 0).toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Posts published this month</p>
          </div>
        </div>
      </section>

      {/* Recent activity */}
      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Activity className="h-4 w-4" /> Recent Activity
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent products */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h3 className="mb-3 font-medium text-foreground">Latest Products</h3>
            <ul className="space-y-2">
              {(recentProducts.data ?? []).length === 0 ? (
                <li className="py-4 text-center text-sm text-muted-foreground">No products yet.</li>
              ) : (
                (recentProducts.data ?? []).map((p) => {
                  const item = p as { id: string; name: string; created_at: string };
                  return (
                    <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <Link
                        href={`/products/${item.id}`}
                        className="group inline-flex items-center gap-1 truncate text-foreground hover:underline"
                      >
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate">{item.name}</span>
                      </Link>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          {/* Recent needs */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h3 className="mb-3 font-medium text-foreground">Latest Needs</h3>
            <ul className="space-y-2">
              {(recentNeeds.data ?? []).length === 0 ? (
                <li className="py-4 text-center text-sm text-muted-foreground">No needs yet.</li>
              ) : (
                (recentNeeds.data ?? []).map((n) => {
                  const item = n as { id: string; title: string; created_at: string };
                  return (
                    <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <Link
                        href={`/needs/${item.id}`}
                        className="group inline-flex items-center gap-1 truncate text-foreground hover:underline"
                      >
                        <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Footer link */}
      <div className="flex justify-end">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          Back to dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function StatCardView({ card }: { card: StatCard }) {
  const inner = (
    <div className="block rounded-2xl border border-border/60 bg-card p-5 shadow-card transition hover:border-brand/20 hover:shadow-card-hover">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
        <card.icon className="h-5 w-5" />
      </div>
      <p className="font-display text-2xl font-bold text-foreground">{card.value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{card.label}</p>
    </div>
  );

  if (card.href) {
    return <Link href={card.href}>{inner}</Link>;
  }
  return inner;
}
