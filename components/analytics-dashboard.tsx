'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { Eye, Users, Bookmark, Star, TrendingUp, MousePointerClick, Package, Link2, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

type DailyViewData = { date: string; views: number; unique: number };
type ProductPerfData = { name: string; views: number; bookmarks: number; reviews: number };
type TrafficSourceData = { source: string; count: number; fill: string };

const TRAFFIC_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

export function AnalyticsDashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dailyViews, setDailyViews] = useState<DailyViewData[]>([]);
  const [productPerf, setProductPerf] = useState<ProductPerfData[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSourceData[]>([]);
  const [totals, setTotals] = useState({
    totalViews: 0,
    uniqueVisitors: 0,
    profileViews: 0,
    bookmarks: 0,
    reviews: 0,
    needMatches: 0,
    avgRating: 0,
    productCount: 0,
  });
  const [weeklyGrowth, setWeeklyGrowth] = useState(0);
  const [monthlyGrowth, setMonthlyGrowth] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get builder's products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, view_count, bookmark_count, review_count, avg_rating')
      .eq('owner_id', user.id);
    const productIds = (products ?? []).map((p) => p.id);

    // Get page views for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: allViews } = await supabase
      .from('page_views')
      .select('entity_type, entity_id, visitor_id, referrer, created_at')
      .or(`and(entity_type.eq.product,entity_id.in.(${productIds.length > 0 ? productIds.join(',') : '00000000-0000-0000-0000-000000000000'})),and(entity_type.eq.builder,entity_id.eq.${user.id})`)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    // Aggregate daily views
    const dailyMap = new Map<string, { views: number; uniqueVisitors: Set<string> }>();
    (allViews ?? []).forEach((v) => {
      const date = new Date(v.created_at).toISOString().split('T')[0];
      if (!dailyMap.has(date)) dailyMap.set(date, { views: 0, uniqueVisitors: new Set() });
      const entry = dailyMap.get(date)!;
      entry.views++;
      if (v.visitor_id) entry.uniqueVisitors.add(v.visitor_id);
    });
    const daily: DailyViewData[] = [];
    dailyMap.forEach((val, date) => {
      daily.push({ date: date.slice(5), views: val.views, unique: val.uniqueVisitors.size });
    });
    setDailyViews(daily);

    // Totals
    const totalViews = (allViews ?? []).length;
    const uniqueVisitors = new Set((allViews ?? []).map((v) => v.visitor_id).filter(Boolean)).size;
    const profileViews = (allViews ?? []).filter((v) => v.entity_type === 'builder').length;

    // Bookmarks on their products
    const { count: bookmarkCount } = await supabase
      .from('bookmarks')
      .select('*', { count: 'exact', head: true })
      .in('product_id', productIds);

    // Reviews on their products
    const { count: reviewCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .in('product_id', productIds);

    // Need matches
    const { count: matchCount } = await supabase
      .from('need_matches')
      .select('*', { count: 'exact', head: true })
      .in('product_id', productIds)
      .eq('status', 'attached');

    // Avg rating
    const ratedProducts = (products ?? []).filter((p) => p.review_count > 0);
    const avgRating = ratedProducts.length > 0
      ? ratedProducts.reduce((s, p) => s + p.avg_rating, 0) / ratedProducts.length
      : 0;

    setTotals({
      totalViews,
      uniqueVisitors,
      profileViews,
      bookmarks: bookmarkCount ?? 0,
      reviews: reviewCount ?? 0,
      needMatches: matchCount ?? 0,
      avgRating,
      productCount: (products ?? []).filter((p) => (p as any).paid !== false).length,
    });

    // Growth rates
    const now = new Date();
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date(); twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const thisWeekViews = (allViews ?? []).filter((v) => new Date(v.created_at) >= weekAgo).length;
    const lastWeekViews = (allViews ?? []).filter((v) => {
      const d = new Date(v.created_at);
      return d >= twoWeeksAgo && d < weekAgo;
    }).length;
    const thisMonthViews = (allViews ?? []).filter((v) => new Date(v.created_at) >= monthAgo).length;
    const lastMonthViews = (allViews ?? []).filter((v) => {
      const d = new Date(v.created_at);
      return d >= twoMonthsAgo && d < monthAgo;
    }).length;

    setWeeklyGrowth(lastWeekViews > 0 ? Math.round(((thisWeekViews - lastWeekViews) / lastWeekViews) * 100) : thisWeekViews > 0 ? 100 : 0);
    setMonthlyGrowth(lastMonthViews > 0 ? Math.round(((thisMonthViews - lastMonthViews) / lastMonthViews) * 100) : thisMonthViews > 0 ? 100 : 0);

    // Product performance
    const perf: ProductPerfData[] = (products ?? []).map((p) => ({
      name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name,
      views: (p as any).view_count ?? 0,
      bookmarks: p.bookmark_count ?? 0,
      reviews: p.review_count ?? 0,
    })).sort((a, b) => b.views - a.views).slice(0, 5);
    setProductPerf(perf);

    // Traffic sources
    const sourceMap = new Map<string, number>();
    (allViews ?? []).forEach((v) => {
      let source = 'Direct';
      if (v.referrer) {
        try {
          const url = new URL(v.referrer);
          source = url.hostname.replace('www.', '');
        } catch { source = 'Other'; }
      }
      sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1);
    });
    const sources: TrafficSourceData[] = Array.from(sourceMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([source, count], i) => ({ source, count, fill: TRAFFIC_COLORS[i % TRAFFIC_COLORS.length] }));
    setTrafficSources(sources);

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    );
  }

  const isPro = profile?.pro_builder;

  if (!isPro) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-50 p-6 text-center">
        <BarChart3 className="mx-auto mb-3 h-8 w-8 text-amber-500" />
        <h3 className="font-display text-lg font-semibold text-foreground">Advanced Analytics is a Pro Builder feature</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Upgrade to Pro Builder to see detailed views, unique visitors, traffic sources, growth rates, and top performing software.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <AnalyticsStat icon={Eye} label="Total Views" value={totals.totalViews} growth={weeklyGrowth} growthLabel="wk" />
        <AnalyticsStat icon={Users} label="Unique Visitors" value={totals.uniqueVisitors} growth={monthlyGrowth} growthLabel="mo" />
        <AnalyticsStat icon={Eye} label="Profile Views" value={totals.profileViews} />
        <AnalyticsStat icon={Bookmark} label="Bookmarks" value={totals.bookmarks} />
        <AnalyticsStat icon={Star} label="Reviews" value={totals.reviews} />
        <AnalyticsStat icon={Link2} label="Need Matches" value={totals.needMatches} />
        <AnalyticsStat icon={Star} label="Avg Rating" value={totals.avgRating > 0 ? totals.avgRating.toFixed(1) : '—'} />
        <AnalyticsStat icon={Package} label="Published" value={totals.productCount} />
      </div>

      {/* Views over time */}
      {dailyViews.length > 0 && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-brand" /> Views (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailyViews}>
                <defs>
                  <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} fill="url(#viewGrad)" />
                <Area type="monotone" dataKey="unique" stroke="#10b981" strokeWidth={2} fill="none" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top performing software */}
        {productPerf.length > 0 && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Package className="h-4 w-4 text-brand" /> Top Performing Software</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={productPerf} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                  <Bar dataKey="views" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Traffic sources */}
        {trafficSources.length > 0 && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><MousePointerClick className="h-4 w-4 text-brand" /> Traffic Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={trafficSources} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {trafficSources.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {trafficSources.map((s) => (
                  <span key={s.source} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                    {s.source} ({s.count})
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function AnalyticsStat({ icon: Icon, label, value, growth, growthLabel }: { icon: typeof Eye; label: string; value: number | string; growth?: number; growthLabel?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-white p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1.5 font-display text-2xl font-bold text-foreground">{value}</p>
      {growth !== undefined && (
        <p className={cn('mt-0.5 text-xs font-medium', growth >= 0 ? 'text-emerald-600' : 'text-red-500')}>
          {growth >= 0 ? '↑' : '↓'} {Math.abs(growth)}% {growthLabel}
        </p>
      )}
    </div>
  );
}
