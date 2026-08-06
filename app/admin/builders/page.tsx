'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search,
  BadgeCheck,
  Hammer,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  ExternalLink,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type BuilderRow = Profile & { product_count: number };

const PAGE_SIZE = 20;

export default function BuilderManagementPage() {
  const [builders, setBuilders] = React.useState<BuilderRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pendingActionId, setPendingActionId] = React.useState<string | null>(null);

  // IDs of builders who have at least one published product
  const [builderIds, setBuilderIds] = React.useState<string[] | null>(null);

  // Debounce search input
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch the set of owner_ids that own >= 1 published product. This is the
  // "has at least one published product" filter the page is built around.
  const fetchBuilderIds = React.useCallback(async () => {
    const { data, error: err } = await supabase
      .from('products')
      .select('owner_id')
      .eq('paid', true);

    if (err) {
      setError(err.message);
      setBuilderIds([]);
      return;
    }
    const uniqueIds = Array.from(
      new Set((data ?? []).map((r) => r.owner_id).filter(Boolean) as string[]),
    );
    setBuilderIds(uniqueIds);
  }, []);

  React.useEffect(() => {
    fetchBuilderIds();
  }, [fetchBuilderIds]);

  const fetchBuilders = React.useCallback(async () => {
    if (builderIds === null) return; // still loading the id set

    setLoading(true);
    setError(null);

    if (builderIds.length === 0) {
      setBuilders([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .in('id', builderIds);

    if (debouncedSearch) {
      query = query.or(
        `username.ilike.%${debouncedSearch}%,full_name.ilike.%${debouncedSearch}%`,
      );
    }

    // Sort by most products first — we approximate by newest member, then
    // re-sort client-side by product_count after counts are resolved.
    query = query.order('created_at', { ascending: false });

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, error: err, count } = await query;

    if (err) {
      setError(err.message);
      setBuilders([]);
      setTotalCount(0);
    } else {
      const rows = (data ?? []) as Profile[];

      // Resolve product counts for the current page's builders in one query.
      const pageIds = rows.map((r) => r.id);
      let countsMap: Record<string, number> = {};

      if (pageIds.length > 0) {
        const { data: countRows, error: countErr } = await supabase
          .from('products')
          .select('owner_id')
          .eq('paid', true)
          .in('owner_id', pageIds);

        if (countErr) {
          // Non-fatal: show counts as 0 if the count query fails.
          console.error('product count query failed', countErr);
        } else {
          countsMap = (countRows ?? []).reduce<Record<string, number>>(
            (acc, r) => {
              const oid = r.owner_id as string;
              acc[oid] = (acc[oid] ?? 0) + 1;
              return acc;
            },
            {},
          );
        }
      }

      const enriched: BuilderRow[] = rows.map((p) => ({
        ...p,
        product_count: countsMap[p.id] ?? 0,
      }));

      // Sort by product_count desc, then username asc, as a sensible default.
      enriched.sort((a, b) => {
        if (b.product_count !== a.product_count) {
          return b.product_count - a.product_count;
        }
        return (a.username ?? '').localeCompare(b.username ?? '');
      });

      setBuilders(enriched);
      setTotalCount(count ?? 0);
    }

    setLoading(false);
  }, [builderIds, debouncedSearch, page]);

  React.useEffect(() => {
    fetchBuilders();
  }, [fetchBuilders]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const toggleVerified = async (b: BuilderRow) => {
    setPendingActionId(b.id);
    const next = !b.verified;
    const { error: err } = await supabase
      .from('profiles')
      .update({ verified: next })
      .eq('id', b.id);
    setPendingActionId(null);

    if (err) {
      toast.error('Failed to update verified status', { description: err.message });
      return;
    }
    toast.success(next ? 'Builder verified' : 'Builder unverified');
    setBuilders((prev) =>
      prev.map((row) => (row.id === b.id ? { ...row, verified: next } : row)),
    );
  };

  const toggleProBuilder = async (b: BuilderRow) => {
    setPendingActionId(b.id);
    const next = !b.pro_builder;
    const { error: err } = await supabase
      .from('profiles')
      .update({ pro_builder: next })
      .eq('id', b.id);
    setPendingActionId(null);

    if (err) {
      toast.error('Failed to update Pro Builder status', { description: err.message });
      return;
    }
    toast.success(next ? 'Pro Builder enabled' : 'Pro Builder disabled');
    setBuilders((prev) =>
      prev.map((row) => (row.id === b.id ? { ...row, pro_builder: next } : row)),
    );
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const initials = (b: Profile) => {
    const base = b.full_name || b.username || '';
    return base
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Builder Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Builders who have published at least one product.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {totalCount} builder{totalCount === 1 ? '' : 's'} total
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or name…"
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Builder</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Pro Builder</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading builders…
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : builders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No builders found.
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence initial={false}>
                {builders.map((b) => (
                  <motion.tr
                    key={b.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    {/* Builder */}
                    <TableCell className="align-top">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {b.avatar_url ? (
                            <AvatarImage src={b.avatar_url} alt={b.username} />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {initials(b)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{b.username}</span>
                          {b.full_name && (
                            <span className="text-xs text-muted-foreground">
                              {b.full_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Verified */}
                    <TableCell className="align-top">
                      {b.verified ? (
                        <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                          <BadgeCheck className="h-3 w-3" /> Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Unverified
                        </Badge>
                      )}
                    </TableCell>

                    {/* Pro Builder */}
                    <TableCell className="align-top">
                      {b.pro_builder ? (
                        <Badge className="gap-1 bg-indigo-600 hover:bg-indigo-600">
                          <Hammer className="h-3 w-3" /> Pro
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Standard
                        </Badge>
                      )}
                    </TableCell>

                    {/* Product count */}
                    <TableCell className="align-top">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        {b.product_count}
                      </span>
                    </TableCell>

                    {/* Joined */}
                    <TableCell className="align-top text-sm text-muted-foreground">
                      {formatDate(b.created_at)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="align-top">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant={b.verified ? 'secondary' : 'default'}
                          onClick={() => toggleVerified(b)}
                          disabled={pendingActionId === b.id}
                          title={b.verified ? 'Unverify' : 'Verify'}
                        >
                          {pendingActionId === b.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <BadgeCheck className="h-3.5 w-3.5" />
                          )}
                          <span className="ml-1">
                            {b.verified ? 'Unverify' : 'Verify'}
                          </span>
                        </Button>

                        <Button
                          size="sm"
                          variant={b.pro_builder ? 'secondary' : 'outline'}
                          onClick={() => toggleProBuilder(b)}
                          disabled={pendingActionId === b.id}
                          title={b.pro_builder ? 'Remove Pro' : 'Make Pro'}
                        >
                          {pendingActionId === b.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Hammer
                              className={cn(
                                'h-3.5 w-3.5',
                                b.pro_builder && 'text-indigo-600',
                              )}
                            />
                          )}
                          <span className="ml-1">
                            {b.pro_builder ? 'Remove Pro' : 'Make Pro'}
                          </span>
                        </Button>

                        <Button asChild size="sm" variant="ghost" title="View profile">
                          <Link href={`/builders/${b.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                            <span className="ml-1">View</span>
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1">Prev</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <span className="mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
