'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import type { Profile, Product } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ArrowRight, Search as SearchIcon } from 'lucide-react';

type BuilderWithCount = Profile & { product_count: number };

export default function BuildersPage() {
  const [builders, setBuilders] = useState<BuilderWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function load() {
      const { data: products } = await supabase
        .from('products')
        .select('owner_id')
        .eq('paid', true);

      const counts = new Map<string, number>();
      (products ?? []).forEach((p: any) => {
        counts.set(p.owner_id, (counts.get(p.owner_id) ?? 0) + 1);
      });

      const ownerIds = Array.from(counts.keys());
      if (ownerIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ownerIds);

      const enriched = (profiles ?? [])
        .map((p: any) => ({ ...p, product_count: counts.get(p.id) ?? 0 }))
        .sort((a, b) => b.product_count - a.product_count);

      setBuilders(enriched as BuilderWithCount[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = builders.filter((b) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      b.username?.toLowerCase().includes(q) ||
      b.full_name?.toLowerCase().includes(q) ||
      b.bio?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Builders
        </h1>
        <p className="mt-2 text-muted-foreground">
          Creators shipping real software on NeedSaaS.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search builders..."
          className="h-11 w-full rounded-xl border border-border/50 bg-card/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 shadow-soft focus:border-brand/30 focus:outline-none focus:ring-4 focus:ring-brand/5"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {query ? 'No builders match your search.' : 'No builders yet. Be the first!'}
          </p>
          <Button asChild className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90">
            <Link href="/signin?tab=signup">Create an account</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <Link
                href={`/builders/${b.id}`}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-5 text-center shadow-soft transition-all hover:border-border hover:bg-card hover:shadow-soft-lg"
              >
                <Avatar className="h-14 w-14 ring-2 ring-border/60 transition group-hover:ring-brand/30">
                  <AvatarFallback className="bg-gradient-to-br from-brand/20 to-brand/5 text-sm font-semibold text-brand">
                    {(b.username ?? b.full_name ?? 'B').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-brand">
                    {b.full_name ?? `@${b.username}`}
                  </p>
                  <p className="text-xs text-muted-foreground">@{b.username}</p>
                </div>
                {b.bio && (
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{b.bio}</p>
                )}
                <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Package className="h-3 w-3" />
                  {b.product_count} {b.product_count === 1 ? 'listing' : 'listings'}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
