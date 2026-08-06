'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search,
  Star,
  Flag,
  CheckCircle2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import type { Review, Product, Profile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type ReviewWithRelations = Review & {
  product: Pick<Product, 'id' | 'name'> | null;
  profile: Pick<Profile, 'id' | 'username'> | null;
};

type FilterKey = 'all' | 'reported' | 'unreported';
type SortKey = 'newest' | 'oldest' | 'highest' | 'lowest';

const PAGE_SIZE = 20;

const FILTER_LABELS: Record<FilterKey, string> = {
  all: 'All',
  reported: 'Reported',
  unreported: 'Unreported',
};

const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  highest: 'Highest Rating',
  lowest: 'Lowest Rating',
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30',
          )}
        />
      ))}
      <span className="ml-1.5 text-xs text-muted-foreground">{rating}/5</span>
    </div>
  );
}

export default function ReviewModerationPage() {
  const [reviews, setReviews] = React.useState<ReviewWithRelations[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [filter, setFilter] = React.useState<FilterKey>('all');
  const [sort, setSort] = React.useState<SortKey>('newest');
  const [page, setPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  const [pendingActionId, setPendingActionId] = React.useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = React.useState<{
    id: string;
    title: string;
  } | null>(null);

  // Debounce search input
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchReviews = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('reviews')
      .select('*, product:products(id, name), profile:profiles(id, username)', {
        count: 'exact',
      });

    if (debouncedSearch) {
      query = query.or(
        `title.ilike.%${debouncedSearch}%,body.ilike.%${debouncedSearch}%`,
      );
    }

    switch (filter) {
      case 'reported':
        query = query.eq('reported', true);
        break;
      case 'unreported':
        query = query.eq('reported', false);
        break;
      case 'all':
      default:
        break;
    }

    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'highest':
        query = query.order('rating', { ascending: false });
        break;
      case 'lowest':
        query = query.order('rating', { ascending: true });
        break;
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, error: err, count } = await query;

    if (err) {
      setError(err.message);
      setReviews([]);
      setTotalCount(0);
    } else {
      setReviews((data ?? []) as unknown as ReviewWithRelations[]);
      setTotalCount(count ?? 0);
    }

    setLoading(false);
  }, [debouncedSearch, filter, sort, page]);

  React.useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const clearReport = async (r: ReviewWithRelations) => {
    setPendingActionId(r.id);
    const { error: err } = await supabase
      .from('reviews')
      .update({ reported: false })
      .eq('id', r.id);
    setPendingActionId(null);

    if (err) {
      toast.error('Failed to clear report', { description: err.message });
      return;
    }
    toast.success('Report cleared');
    setReviews((prev) =>
      prev.map((row) => (row.id === r.id ? { ...row, reported: false } : row)),
    );
  };

  const deleteReview = async (id: string) => {
    setPendingActionId(id);
    const { error: err } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);
    setPendingActionId(null);

    if (err) {
      toast.error('Failed to delete review', { description: err.message });
      return;
    }
    toast.success('Review deleted');
    setConfirmTarget(null);
    // If we removed the last item on a page > 1, step back a page.
    if (reviews.length === 1 && page > 1) {
      setPage((p) => Math.max(1, p - 1));
    } else {
      fetchReviews();
    }
  };

  const handleConfirm = () => {
    if (!confirmTarget) return;
    deleteReview(confirmTarget.id);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncate = (text: string | null, max = 120) => {
    if (!text) return <span className="text-muted-foreground">—</span>;
    return text.length > max ? `${text.slice(0, max)}…` : text;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Moderation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Moderate reported and routine product reviews.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {totalCount} review{totalCount === 1 ? '' : 's'} total
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or body…"
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filter}
            onValueChange={(v) => {
              setFilter(v as FilterKey);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(FILTER_LABELS) as FilterKey[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {FILTER_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v as SortKey);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {SORT_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading reviews…
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No reviews found.
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence initial={false}>
                {reviews.map((r) => (
                  <motion.tr
                    key={r.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    {/* Product */}
                    <TableCell className="align-top">
                      {r.product ? (
                        <Link
                          href={`/products/${r.product.id}`}
                          className="group inline-flex items-center gap-1 font-medium hover:underline"
                        >
                          {r.product.name}
                          <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Unknown product</span>
                      )}
                    </TableCell>

                    {/* Reviewer */}
                    <TableCell className="align-top">
                      {r.profile ? (
                        <Link
                          href={`/builders/${r.profile.id}`}
                          className="hover:underline"
                        >
                          {r.profile.username}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Unknown user</span>
                      )}
                    </TableCell>

                    {/* Rating */}
                    <TableCell className="align-top">
                      <Stars rating={r.rating} />
                    </TableCell>

                    {/* Review text */}
                    <TableCell className="align-top max-w-sm">
                      <div className="flex flex-col gap-0.5">
                        {r.title && (
                          <span className="line-clamp-1 font-medium">{r.title}</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {truncate(r.body)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="align-top">
                      {r.reported ? (
                        <Badge
                          variant="outline"
                          className="gap-1 border-amber-500 text-amber-600"
                        >
                          <Flag className="h-3 w-3" /> Reported
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Clear
                        </Badge>
                      )}
                    </TableCell>

                    {/* Created */}
                    <TableCell className="align-top text-sm text-muted-foreground">
                      {formatDate(r.created_at)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="align-top">
                      <div className="flex items-center justify-end gap-1">
                        {r.reported && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => clearReport(r)}
                            disabled={pendingActionId === r.id}
                            title="Clear report"
                          >
                            {pendingActionId === r.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            <span className="ml-1">Clear</span>
                          </Button>
                        )}

                        <Button asChild size="sm" variant="ghost" title="View product">
                          <Link href={`/products/${r.product_id}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() =>
                            setConfirmTarget({ id: r.id, title: r.title ?? 'Untitled review' })
                          }
                          title="Delete review"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Confirm dialog (delete) */}
      <Dialog
        open={confirmTarget !== null}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete review?</DialogTitle>
            <DialogDescription>
              Deleting “{confirmTarget?.title}” will permanently remove it. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={pendingActionId === confirmTarget?.id}
            >
              {pendingActionId === confirmTarget?.id && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
