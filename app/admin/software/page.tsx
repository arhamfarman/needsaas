'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search,
  Check,
  X,
  Star,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import type { Product, Profile, Category } from '@/lib/types';
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

type ProductWithRelations = Product & {
  category: Category | null;
  profile: Profile | null;
};

type FilterKey = 'all' | 'pending' | 'published' | 'featured';
type SortKey = 'newest' | 'oldest' | 'name';

const PAGE_SIZE = 20;

const FILTER_LABELS: Record<FilterKey, string> = {
  all: 'All',
  pending: 'Pending',
  published: 'Published',
  featured: 'Featured',
};

const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  name: 'Name',
};

export default function SoftwareManagementPage() {
  const [products, setProducts] = React.useState<ProductWithRelations[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [filter, setFilter] = React.useState<FilterKey>('all');
  const [sort, setSort] = React.useState<SortKey>('newest');
  const [page, setPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);

  const [pendingActionId, setPendingActionId] = React.useState<string | null>(
    null,
  );
  const [confirmTarget, setConfirmTarget] = React.useState<{
    id: string;
    name: string;
    kind: 'reject' | 'delete';
  } | null>(null);

  // Debounce search input
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('products')
      .select('*, category:categories(*), profile:profiles(*)', {
        count: 'exact',
      });

    if (debouncedSearch) {
      query = query.ilike('name', `%${debouncedSearch}%`);
    }

    switch (filter) {
      case 'pending':
        query = query.eq('paid', false);
        break;
      case 'published':
        query = query.eq('paid', true);
        break;
      case 'featured':
        query = query.eq('featured', true);
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
      case 'name':
        query = query.order('name', { ascending: true });
        break;
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, error: err, count } = await query;

    if (err) {
      setError(err.message);
      setProducts([]);
      setTotalCount(0);
    } else {
      setProducts((data ?? []) as unknown as ProductWithRelations[]);
      setTotalCount(count ?? 0);
    }

    setLoading(false);
  }, [debouncedSearch, filter, sort, page]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const approve = async (id: string) => {
    setPendingActionId(id);
    // paid/paid_at are not directly UPDATE-able by `authenticated` (see
    // add_product_fee_and_images.sql.sql) — approval goes through an
    // admin-only SECURITY DEFINER function instead.
    const { error: err } = await supabase.rpc('admin_approve_product', { product_id: id });
    setPendingActionId(null);

    if (err) {
      toast.error('Failed to approve product', { description: err.message });
      return;
    }
    toast.success('Product approved & published');
    fetchProducts();
  };

  const feature = async (product: ProductWithRelations) => {
    setPendingActionId(product.id);
    const next = !product.featured;
    const { error: err } = await supabase.rpc('admin_set_product_featured', {
      product_id: product.id,
      featured: next,
    });
    setPendingActionId(null);

    if (err) {
      toast.error('Failed to update featured status', {
        description: err.message,
      });
      return;
    }
    toast.success(next ? 'Product featured' : 'Product unfeatured');
    fetchProducts();
  };

  const removeProduct = async (id: string) => {
    setPendingActionId(id);
    const { error: err } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    setPendingActionId(null);

    if (err) {
      toast.error('Failed to delete product', { description: err.message });
      return;
    }
    toast.success('Product deleted');
    setConfirmTarget(null);
    // If we removed the last item on a page > 1, step back a page.
    if (products.length === 1 && page > 1) {
      setPage((p) => Math.max(1, p - 1));
    } else {
      fetchProducts();
    }
  };

  const handleConfirm = () => {
    if (!confirmTarget) return;
    removeProduct(confirmTarget.id);
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Software Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review, approve, feature, and manage all submitted products.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {totalCount} product{totalCount === 1 ? '' : 's'} total
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => { setFilter(v as FilterKey); setPage(1); }}>
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

          <Select value={sort} onValueChange={(v) => { setSort(v as SortKey); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
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
              <TableHead>Owner</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Pricing</TableHead>
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
                    Loading products…
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence initial={false}>
                {products.map((p) => (
                  <motion.tr
                    key={p.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    {/* Product */}
                    <TableCell className="align-top">
                      <div className="flex flex-col">
                        <Link
                          href={`/products/${p.id}`}
                          className="group inline-flex items-center gap-1 font-medium hover:underline"
                        >
                          {p.name}
                          <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                        {p.tagline && (
                          <span className="mt-0.5 line-clamp-1 max-w-xs text-xs text-muted-foreground">
                            {p.tagline}
                          </span>
                        )}
                        {p.featured && (
                          <Badge variant="default" className="mt-1 w-fit gap-1">
                            <Sparkles className="h-3 w-3" /> Featured
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Owner */}
                    <TableCell className="align-top">
                      {p.profile ? (
                        <Link
                          href={`/builders/${p.profile.id}`}
                          className="hover:underline"
                        >
                          {p.profile.username}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>

                    {/* Category */}
                    <TableCell className="align-top">
                      {p.category ? (
                        <Badge variant="secondary">{p.category.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Pricing */}
                    <TableCell className="align-top text-sm">
                      {p.price_from || p.pricing || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="align-top">
                      {p.paid ? (
                        <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                          <Check className="h-3 w-3" /> Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pending
                        </Badge>
                      )}
                    </TableCell>

                    {/* Created */}
                    <TableCell className="align-top text-sm text-muted-foreground">
                      {formatDate(p.created_at)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="align-top">
                      <div className="flex items-center justify-end gap-1">
                        {!p.paid && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => approve(p.id)}
                            disabled={pendingActionId === p.id}
                            title="Approve & publish"
                          >
                            {pendingActionId === p.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            <span className="ml-1">Approve</span>
                          </Button>
                        )}

                        {!p.paid && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setConfirmTarget({ id: p.id, name: p.name, kind: 'reject' })
                            }
                            title="Reject & delete"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span className="ml-1">Reject</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant={p.featured ? 'secondary' : 'outline'}
                          onClick={() => feature(p)}
                          disabled={pendingActionId === p.id}
                          title={p.featured ? 'Unfeature' : 'Feature'}
                        >
                          {pendingActionId === p.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Star
                              className={cn(
                                'h-3.5 w-3.5',
                                p.featured && 'fill-current text-amber-500',
                              )}
                            />
                          )}
                        </Button>

                        <Button asChild size="sm" variant="ghost" title="Edit">
                          <Link href={`/products/${p.id}`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() =>
                            setConfirmTarget({ id: p.id, name: p.name, kind: 'delete' })
                          }
                          title="Delete"
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

      {/* Confirm dialog (reject / delete) */}
      <Dialog
        open={confirmTarget !== null}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmTarget?.kind === 'reject' ? 'Reject product?' : 'Delete product?'}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget?.kind === 'reject'
                ? `Rejecting “${confirmTarget?.name}” will permanently delete it. This cannot be undone.`
                : `Deleting “${confirmTarget?.name}” will permanently remove it. This cannot be undone.`}
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
              {confirmTarget?.kind === 'reject' ? 'Reject & delete' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
