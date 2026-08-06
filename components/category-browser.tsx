'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Package, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type SortOption = 'featured' | 'newest' | 'rating' | 'views' | 'trending';
type PriceFilter = 'all' | 'free' | 'paid';

export function CategoryBrowser({
  categoryId,
  allCategories,
}: {
  categoryId: string;
  allCategories: Category[];
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>('featured');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [tags, setTags] = useState<{ id: string; name: string; count: number }[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const perPage = 12;

  // Fetch available tags for this category
  useEffect(() => {
    async function loadTags() {
      const { data } = await supabase
        .from('product_tags')
        .select(`tag:tags(id, name), product:products!inner(id)`)
        .eq('product.category_id', categoryId);
      if (data) {
        const tagMap = new Map<string, { name: string; count: number }>();
        data.forEach((d: any) => {
          if (d.tag) {
            const existing = tagMap.get(d.tag.id);
            if (existing) existing.count++;
            else tagMap.set(d.tag.id, { name: d.tag.name, count: 1 });
          }
        });
        setTags(Array.from(tagMap.entries()).map(([id, v]) => ({ id, name: v.name, count: v.count })).sort((a, b) => b.count - a.count).slice(0, 12));
      }
    }
    loadTags();
  }, [categoryId]);

  // Fetch products
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      let query = supabase
        .from('products')
        .select(`*, category:categories(*), profile:profiles(username, verified)`, { count: 'exact' })
        .eq('paid', true)
        .eq('category_id', categoryId);

      if (priceFilter === 'free') {
        query = query.in('pricing', ['Free', 'Open Source']);
      } else if (priceFilter === 'paid') {
        query = query.not('pricing', 'in', '("Free","Open Source")');
      }

      if (selectedTag) {
        const { data: productIds } = await supabase
          .from('product_tags')
          .select('product_id')
          .eq('tag_id', selectedTag);
        const ids = (productIds ?? []).map((p: any) => p.product_id);
        if (ids.length === 0) {
          setProducts([]);
          setTotal(0);
          setLoading(false);
          return;
        }
        query = query.in('id', ids);
      }

      switch (sort) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'rating':
          query = query.order('avg_rating', { ascending: false });
          break;
        case 'views':
          query = query.order('view_count', { ascending: false });
          break;
        case 'trending':
          query = query.order('bookmark_count', { ascending: false });
          break;
        case 'featured':
        default:
          query = query.order('featured', { ascending: false }).order('avg_rating', { ascending: false });
          break;
      }

      query = query.range((page - 1) * perPage, page * perPage - 1);
      const { data, count } = await query;
      setProducts((data as Product[]) ?? []);
      setTotal(count ?? 0);
      setLoading(false);
    }
    loadProducts();
  }, [categoryId, sort, priceFilter, selectedTag, page]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [sort, priceFilter, selectedTag]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/50 p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{total} software</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Price filter */}
          <div className="flex items-center gap-1 rounded-lg border border-border/60 p-0.5">
            {(['all', 'free', 'paid'] as PriceFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setPriceFilter(f)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition',
                  priceFilter === f ? 'bg-brand text-brand-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f === 'all' ? 'All' : f === 'free' ? 'Free' : 'Paid'}
              </button>
            ))}
          </div>
          {/* Sort */}
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="h-9 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="views">Most Viewed</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Tags:</span>
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition',
                selectedTag === tag.id
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              {tag.name} <span className="opacity-50">{tag.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No software found with these filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Internal links to other categories */}
      {allCategories.length > 1 && (
        <div className="mt-10 border-t border-border/40 pt-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Browse other categories</h3>
          <div className="flex flex-wrap gap-2">
            {allCategories.filter((c) => c.id !== categoryId).map((cat) => (
              <Link key={cat.id} href={`/software/${cat.slug}`}>
                <Badge variant="outline" className="cursor-pointer border-border/60 text-muted-foreground hover:border-brand hover:text-brand">
                  {cat.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
