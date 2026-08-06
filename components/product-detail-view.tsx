'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { trackPageView } from '@/lib/analytics';
import type { Product, Review, Need, NeedProductLink, Product as ProductType } from '@/lib/types';
import { NeedCard } from '@/components/need-card';
import { ProductImage } from '@/components/product-image';
import { VerifiedBadge } from '@/components/verified-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Star, ArrowLeft, Share2, ExternalLink, Github, Package, Lightbulb,
  PencilLine, MessageSquare, AlertCircle, Bookmark, Eye, FileText,
} from 'lucide-react';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export function ProductDetailView() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-10"><div className="h-64 w-full animate-pulse rounded-xl bg-muted" /></div>}>
      <ProductDetailPageInner />
    </Suspense>
  );
}

function ProductDetailPageInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [linkedNeeds, setLinkedNeeds] = useState<Need[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkPending, setBookmarkPending] = useState(false);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myReview, setMyReview] = useState<Review | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select(`*, category:categories(*), profile:profiles(*)`)
      .eq('id', id)
      .maybeSingle();
    if (!data) { setLoading(false); return; }
    setProduct(data as Product);

    const [rev, links] = await Promise.all([
      supabase.from('reviews').select(`*, profile:profiles(*)`).eq('product_id', id).order('created_at', { ascending: false }),
      supabase.from('need_product_links').select(`*, need:needs(*, category:categories(*), profile:profiles(*))`).eq('product_id', id),
    ]);
    setReviews((rev.data as Review[]) ?? []);
    setLinkedNeeds((links.data?.map((l) => l.need).filter(Boolean) as Need[]) ?? []);

    // Related products: same category, excluding self
    if ((data as Product).category_id) {
      const { data: related } = await supabase
        .from('products')
        .select(`*, category:categories(*), profile:profiles(*)`)
        .eq('category_id', (data as Product).category_id)
        .eq('paid', true)
        .neq('id', id)
        .order('avg_rating', { ascending: false })
        .limit(4);
      setRelatedProducts((related as Product[]) ?? []);
    }

    if (user) {
      const [mine, bk] = await Promise.all([
        supabase.from('reviews').select('*').eq('product_id', id).eq('user_id', user.id).maybeSingle(),
        supabase.from('bookmarks').select('id').eq('product_id', id).eq('user_id', user.id).maybeSingle(),
      ]);
      if (mine.data) { setMyReview(mine.data as Review); setRating((mine.data as Review).rating); setReviewTitle((mine.data as Review).title ?? ''); setReviewBody((mine.data as Review).body ?? ''); }
      setIsBookmarked(!!bk.data);
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  // Track page view once
  useEffect(() => {
    if (id) trackPageView('product', id);
  }, [id]);

  useEffect(() => {
    if (searchParams.get('paid') === '1') {
      toast.success('Payment received! Your product is now published.');
      router.replace(`/products/${id}`);
    }
  }, [searchParams, router, id]);

  async function toggleBookmark() {
    if (!user) { router.push('/signin'); return; }
    if (!product) return;
    setBookmarkPending(true);
    if (isBookmarked) {
      const { error } = await supabase.from('bookmarks').delete().eq('product_id', product.id).eq('user_id', user.id);
      if (!error) { setIsBookmarked(false); toast.success('Bookmark removed'); }
    } else {
      const { error } = await supabase.from('bookmarks').insert({ product_id: product.id, user_id: user.id });
      if (!error) { setIsBookmarked(true); toast.success('Bookmarked!'); }
      else if (error.code === '23505') toast.error('Already bookmarked');
      else toast.error(error.message);
    }
    setBookmarkPending(false);
  }

  async function submitReview() {
    if (!user) { router.push('/signin'); return; }
    if (!product) return;
    if (!reviewBody.trim()) { toast.error('Please write a review'); return; }
    setSubmitting(true);
    if (myReview) {
      const { error } = await supabase.from('reviews').update({ rating, title: reviewTitle || null, body: reviewBody, updated_at: new Date().toISOString() }).eq('id', myReview.id);
      if (!error) toast.success('Review updated'); else toast.error(error.message);
    } else {
      const { error } = await supabase.from('reviews').insert({ product_id: product.id, user_id: user.id, rating, title: reviewTitle || null, body: reviewBody });
      if (!error) toast.success('Review posted'); else if (error.code === '23505') toast.error('You already reviewed this product'); else toast.error(error.message);
    }
    setSubmitting(false);
    load();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="mb-6 h-5 w-20" />
        <Skeleton className="mb-4 h-12 w-2/3" />
        <Skeleton className="mb-8 h-32 w-full" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Product not found</h1>
        <Button asChild className="mt-6"><Link href="/search">Back to search</Link></Button>
      </div>
    );
  }

  const isOwner = user?.id === product.owner_id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <Link href="/search" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to explore
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl">
            <ProductImage
              path={product.logo_url}
              alt={`${product.name} logo`}
              fill
              sizes="64px"
              fallback={
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 font-display text-xl font-bold text-brand ring-1 ring-brand/20">
                  {product.name.slice(0, 2).toUpperCase()}
                </div>
              }
            />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{product.name}</h1>
              {product.featured && (
                <Badge className="bg-brand/10 text-brand border-brand/20">Featured</Badge>
              )}
              {product.review_count > 0 && (
                <div className="flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{Number(product.avg_rating).toFixed(1)}</span>
                  <span className="text-muted-foreground">({product.review_count})</span>
                </div>
              )}
            </div>
            <p className="text-lg text-muted-foreground">{product.tagline}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {product.category && <Link href={`/software/${product.category.slug}`}><Badge variant="outline" className="border-border/60 text-muted-foreground hover:border-brand hover:text-brand">{product.category.name}</Badge></Link>}
              {product.pricing && <Badge variant="outline" className="border-border/60 text-muted-foreground">{product.pricing}</Badge>}
              {product.price_from && <Badge variant="outline" className="border-brand/20 text-brand">From {product.price_from}</Badge>}
              <Link href={`/builders/${product.owner_id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="bg-muted text-[9px] font-semibold text-muted-foreground">
                    {(product.profile?.username ?? 'B').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                @{product.profile?.username ?? 'builder'}
                {product.profile?.verified && <VerifiedBadge />}
              </Link>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {product.url && (
              <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
                <a href={product.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-4 w-4" /> Visit
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              onClick={toggleBookmark}
              disabled={bookmarkPending}
              className={cn(isBookmarked && 'border-brand text-brand')}
            >
              <Bookmark className={cn('h-4 w-4', isBookmarked && 'fill-brand')} />
            </Button>
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied'); }}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" /> {product.view_count} views
          </span>
          <span className="flex items-center gap-1.5">
            <Bookmark className="h-4 w-4" /> {product.bookmark_count} bookmarks
          </span>
          {product.doc_url && (
            <a href={product.doc_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-foreground">
              <FileText className="h-4 w-4" /> Docs
            </a>
          )}
        </div>

        {isOwner && !product.paid && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">This listing is not yet published</p>
              <p className="text-xs text-muted-foreground">Complete the $10 listing fee to publish your product to the marketplace.</p>
            </div>
          </div>
        )}

        {product.images && product.images.length > 0 && (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {product.images.map((img, i) => (
              <div key={i} className="group relative aspect-video overflow-hidden rounded-xl border border-border/40 bg-muted">
                <ProductImage path={img} alt={`${product.name} screenshot ${i + 1}`} fill sizes="600px" />
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 whitespace-pre-line text-base leading-relaxed text-foreground/90">{product.description}</p>

        {product.repo_url && (
          <a href={product.repo_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <Github className="h-4 w-4" /> View repository
          </a>
        )}
      </motion.div>

      {/* Linked needs */}
      {linkedNeeds.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
            <Lightbulb className="h-5 w-5 text-brand" /> Needs this solves
            <span className="text-sm font-normal text-muted-foreground">{linkedNeeds.length}</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {linkedNeeds.map((n) => <NeedCard key={n.id} need={n} />)}
          </div>
        </section>
      )}

      {/* Related software */}
      {relatedProducts.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
            <Package className="h-5 w-5 text-emerald-500" /> Related Software
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {relatedProducts.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`} className="flex items-center gap-3 rounded-xl border border-border/60 bg-white p-4 transition hover:border-border hover:shadow-card">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {p.logo_url ? (
                    <ProductImage path={p.logo_url} alt={p.name} fill sizes="40px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/20 to-brand/5 text-[10px] font-bold text-brand">
                      {p.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.tagline}</p>
                </div>
                {p.review_count > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {Number(p.avg_rating).toFixed(1)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="mt-14">
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold">
          <MessageSquare className="h-5 w-5 text-brand" /> Reviews
          <span className="text-sm font-normal text-muted-foreground">{reviews.length}</span>
        </h2>

        <div className="mb-8 rounded-xl border border-border/60 bg-card/40 p-5">
          {user ? (
            <>
              <div className="mb-3 flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">{myReview ? 'Edit your review' : 'Write a review'}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} className="p-0.5">
                      <Star className={`h-5 w-5 transition ${(hoverRating || rating) >= s ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <Input
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="Title (optional)"
                className="mb-2"
              />
              <Textarea
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                placeholder="Share your experience with this software..."
                rows={4}
              />
              <div className="mt-3 flex justify-end">
                <Button onClick={submitReview} disabled={submitting} className="bg-brand text-brand-foreground hover:bg-brand/90">
                  <PencilLine className="mr-1.5 h-4 w-4" /> {myReview ? 'Update' : 'Post review'}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">Sign in to leave a review.</p>
              <Button asChild variant="outline" size="sm"><Link href="/signin">Sign in</Link></Button>
            </div>
          )}
        </div>

        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-xl border border-border/60 bg-card/40 p-5">
                <div className="flex items-center justify-between">
                  <Link href={`/builders/${r.user_id}`} className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-muted text-[10px] font-semibold text-muted-foreground">
                        {(r.profile?.username ?? 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground hover:text-brand">@{r.profile?.username ?? 'user'}</span>
                    {r.profile?.verified && <VerifiedBadge />}
                  </Link>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-3.5 w-3.5 ${r.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                </div>
                {r.title && <h3 className="mt-3 font-medium text-foreground">{r.title}</h3>}
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                <p className="mt-2 text-xs text-muted-foreground/70">{formatDate(r.created_at)}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/30 px-6 py-10 text-center">
            <p className="text-sm text-muted-foreground">No reviews yet. Be the first to share your experience.</p>
          </div>
        )}
      </section>
    </div>
  );
}
