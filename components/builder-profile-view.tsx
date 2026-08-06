'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { trackPageView } from '@/lib/analytics';
import type { Profile, Product, Need, Review, BuilderAnalytics } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { NeedCard } from '@/components/need-card';
import { VerifiedBadge } from '@/components/verified-badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Package, Lightbulb, Globe, Twitter, Github, MapPin, Calendar, ArrowLeft, Star, CheckCircle2, ArrowUp, Trophy, Eye, Bookmark, MessageSquare, Crown } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { ProductImage } from '@/components/product-image';

export function BuilderProfileView() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [completedNeeds, setCompletedNeeds] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [analytics, setAnalytics] = useState<BuilderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      setProfile((p as Profile) ?? null);

      const [prods, nds, completed] = await Promise.all([
        supabase.from('products').select(`*, category:categories(*), profile:profiles(*)`).eq('owner_id', id).eq('paid', true).order('created_at', { ascending: false }),
        supabase.from('needs').select(`*, category:categories(*), profile:profiles(*)`).eq('owner_id', id).order('vote_count', { ascending: false }),
        supabase.from('needs').select('id, status, vote_count, reward_amount').eq('builder_committed_id', id),
      ]);
      setProducts((prods.data as Product[]) ?? []);
      setNeeds((nds.data as Need[]) ?? []);
      const completedData = (completed.data as Need[]) ?? [];
      setCompletedNeeds(completedData.filter((n) => n.status === 'fulfilled').length);
      setTotalVotes(completedData.reduce((s, n) => s + n.vote_count, 0));

      // Fetch reviews on their products
      if ((prods.data ?? []).length > 0) {
        const productIds = (prods.data as Product[]).map((p) => p.id);
        const { data: revs } = await supabase
          .from('reviews')
          .select(`*, profile:profiles(*)`)
          .in('product_id', productIds)
          .order('created_at', { ascending: false })
          .limit(10);
        setReviews((revs as Review[]) ?? []);
      }

      setLoading(false);
    };
    run();
  }, [id]);

  // Track page view
  useEffect(() => {
    if (id) trackPageView('builder', id);
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="mb-8 h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Builder not found</h1>
        <Button asChild className="mt-6"><Link href="/search">Back to search</Link></Button>
      </div>
    );
  }

  const avgRating = products.length > 0 && products.some((p) => p.review_count > 0)
    ? (products.filter((p) => p.review_count > 0).reduce((s, p) => s + p.avg_rating, 0) / products.filter((p) => p.review_count > 0).length).toFixed(1)
    : '—';
  const totalBookmarks = products.reduce((s, p) => s + p.bookmark_count, 0);
  const totalViews = products.reduce((s, p) => s + p.view_count, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Link href="/search" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to explore
      </Link>

      {/* Profile header with cover */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="overflow-hidden rounded-2xl border border-border/60 bg-card/40">
        {/* Cover */}
        <div className="relative h-32 w-full bg-gradient-to-br from-brand/20 via-brand/5 to-muted sm:h-40">
          {profile.cover_url && (
            <ProductImage path={profile.cover_url} alt={`${profile.username} cover`} fill sizes="100vw" />
          )}
          {profile.pro_builder && (
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-medium text-brand-foreground shadow-soft">
              <Crown className="h-3.5 w-3.5" /> Pro Builder
            </div>
          )}
        </div>

        <div className="px-6 pb-6 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20 rounded-2xl ring-4 ring-card -mt-10 sm:-mt-12">
              <AvatarFallback className="rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 font-display text-2xl font-bold text-brand ring-1 ring-brand/20">
                {profile.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {profile.full_name ?? `@${profile.username}`}
                </h1>
                {profile.verified && <VerifiedBadge size="md" showLabel />}
              </div>
              <p className="text-muted-foreground">@{profile.username}</p>
              {profile.bio && <p className="max-w-2xl text-sm leading-relaxed text-foreground/90">{profile.bio}</p>}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-muted-foreground">
                {profile.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {profile.location}</span>}
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {formatDate(profile.created_at)}</span>
                {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground"><Globe className="h-3.5 w-3.5" /> Website</a>}
                {profile.twitter && <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground"><Twitter className="h-3.5 w-3.5" /> {profile.twitter}</a>}
                {profile.github && <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground"><Github className="h-3.5 w-3.5" /> {profile.github}</a>}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border/60 pt-6 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Software" value={products.length} icon={Package} />
            <Stat label="Needs Solved" value={completedNeeds} icon={CheckCircle2} />
            <Stat label="Total Views" value={totalViews} icon={Eye} />
            <Stat label="Bookmarks" value={totalBookmarks} icon={Bookmark} />
            <Stat label="Avg Rating" value={avgRating} icon={Star} />
            <Stat label="Reviews" value={reviews.length} icon={MessageSquare} />
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="products" className="mt-10">
        <TabsList>
          <TabsTrigger value="products" className="gap-1.5"><Package className="h-4 w-4" /> Software ({products.length})</TabsTrigger>
          <TabsTrigger value="needs" className="gap-1.5"><Lightbulb className="h-4 w-4" /> Needs ({needs.length})</TabsTrigger>
          {reviews.length > 0 && (
            <TabsTrigger value="reviews" className="gap-1.5"><MessageSquare className="h-4 w-4" /> Reviews ({reviews.length})</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="products" className="mt-6">
          {products.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border/60 bg-card/30 px-6 py-10 text-center text-sm text-muted-foreground">
              No software published yet.
            </p>
          )}
        </TabsContent>
        <TabsContent value="needs" className="mt-6">
          {needs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {needs.map((n) => <NeedCard key={n.id} need={n} />)}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border/60 bg-card/30 px-6 py-10 text-center text-sm text-muted-foreground">
              No needs posted yet.
            </p>
          )}
        </TabsContent>
        {reviews.length > 0 && (
          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-border/60 bg-card/40 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-muted text-[9px] font-semibold text-muted-foreground">
                          {(r.profile?.username ?? 'U').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">@{r.profile?.username ?? 'user'}</span>
                      {r.profile?.verified && <VerifiedBadge />}
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3.5 w-3.5 ${r.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                  </div>
                  {r.title && <h3 className="mt-3 font-medium">{r.title}</h3>}
                  <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground/70">{formatDate(r.created_at)}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof Package }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-display text-xl font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
