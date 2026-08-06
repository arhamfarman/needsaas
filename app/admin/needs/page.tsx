'use client';

import * as React from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Search,
  MoreHorizontal,
  Pin,
  PinOff,
  Star,
  StarOff,
  Archive,
  Trash2,
  Eye,
  GitMerge,
  Loader2,
  ExternalLink,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import type { Need, Profile, Category } from '@/lib/types';
import { cn } from '@/lib/utils';

// Admin statuses per spec: open/committed/building/launched/closed.
// (The shared NeedStatus type uses 'fulfilled' rather than 'launched', so we
// keep a local type here that matches the actual allowed column values.)
type AdminNeedStatus = 'open' | 'committed' | 'building' | 'launched' | 'closed';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
  PaginationEllipsis,
} from '@/components/ui/pagination';

const PAGE_SIZE = 20;

const STATUS_VALUES: AdminNeedStatus[] = ['open', 'committed', 'building', 'launched', 'closed'];

type Filter =
  | 'all'
  | 'open'
  | 'committed'
  | 'building'
  | 'launched'
  | 'closed'
  | 'pinned'
  | 'featured';

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Committed', value: 'committed' },
  { label: 'Building', value: 'building' },
  { label: 'Launched', value: 'launched' },
  { label: 'Closed', value: 'closed' },
  { label: 'Pinned', value: 'pinned' },
  { label: 'Featured', value: 'featured' },
];

const STATUS_BADGE_VARIANT: Record<AdminNeedStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'default',
  committed: 'secondary',
  building: 'secondary',
  launched: 'default',
  closed: 'outline',
};

type NeedRow = Pick<
  Need,
  | 'id'
  | 'title'
  | 'description'
  | 'category_id'
  | 'owner_id'
  | 'vote_count'
  | 'reward_amount'
  | 'need_score'
  | 'pinned'
  | 'featured_need'
  | 'created_at'
> & {
  // The status column is `text`, so admin values include 'launched'.
  status: AdminNeedStatus;
  category: Pick<Category, 'id' | 'name'> | null;
  profile: Pick<Profile, 'id' | 'username'> | null;
};

function truncate(text: string, max = 80): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

function buildRange(current: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, totalPages - 1, totalPages, current]);
  if (current - 1 > 2) pages.add(current - 1);
  if (current + 1 < totalPages - 1) pages.add(current + 1);
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const out: (number | 'ellipsis')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    out.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) out.push('ellipsis');
  }
  return out;
}

export default function AdminNeedsPage() {
  const [rows, setRows] = React.useState<NeedRow[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<Filter>('all');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  // Merge dialog state
  const [mergeSource, setMergeSource] = React.useState<NeedRow | null>(null);
  const [mergeTargetId, setMergeTargetId] = React.useState<string>('');
  const [mergeCandidates, setMergeCandidates] = React.useState<NeedRow[]>([]);
  const [mergeOpen, setMergeOpen] = React.useState(false);
  const [merging, setMerging] = React.useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<NeedRow | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const fetchNeeds = React.useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('needs')
        .select<string, NeedRow>(
          'id,title,description,category_id,owner_id,status,vote_count,reward_amount,need_score,pinned,featured_need,created_at,category:categories(id,name),profile:profiles(id,username)',
          { count: 'exact' }
        );

      if (search.trim()) {
        query = query.ilike('title', `%${search.trim()}%`);
      }

      switch (filter) {
        case 'pinned':
          query = query.eq('pinned', true);
          break;
        case 'featured':
          query = query.eq('featured_need', true);
          break;
        case 'all':
          break;
        default:
          query = query.eq('status', filter);
      }

      const from = (safePage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, count, error } = await query;
      if (error) throw error;

      setRows((data ?? []) as NeedRow[]);
      setTotal(count ?? 0);
    } catch (err) {
      toast.error('Failed to load needs', {
        description: err instanceof Error ? err.message : 'Unexpected error',
      });
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filter, search, safePage]);

  React.useEffect(() => {
    fetchNeeds();
  }, [fetchNeeds]);

  // Debounced search handling
  React.useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const refreshRow = React.useCallback((id: string, patch: Partial<NeedRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const runAction = async (
    id: string,
    label: string,
    fn: () => Promise<{ error: Error | null }>
  ) => {
    setActionLoadingId(id);
    try {
      const { error } = await fn();
      if (error) throw error;
      toast.success(label);
    } catch (err) {
      toast.error(`Failed: ${label}`, {
        description: err instanceof Error ? err.message : 'Unexpected error',
      });
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStatusChange = async (need: NeedRow, status: AdminNeedStatus) => {
    try {
      await runAction(need.id, `Status set to ${status}`, async () => {
        const { error } = await supabase
          .from('needs')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', need.id);
        return { error: error as Error | null };
      });
      refreshRow(need.id, { status });
    } catch {
      /* handled in runAction */
    }
  };

  const handleTogglePinned = async (need: NeedRow) => {
    const next = !need.pinned;
    try {
      await runAction(need.id, next ? 'Need pinned' : 'Need unpinned', async () => {
        const { error } = await supabase
          .from('needs')
          .update({ pinned: next, updated_at: new Date().toISOString() })
          .eq('id', need.id);
        return { error: error as Error | null };
      });
      refreshRow(need.id, { pinned: next });
    } catch {
      /* handled */
    }
  };

  const handleToggleFeatured = async (need: NeedRow) => {
    const next = !need.featured_need;
    try {
      await runAction(need.id, next ? 'Need featured' : 'Need unfeatured', async () => {
        const { error } = await supabase
          .from('needs')
          .update({ featured_need: next, updated_at: new Date().toISOString() })
          .eq('id', need.id);
        return { error: error as Error | null };
      });
      refreshRow(need.id, { featured_need: next });
    } catch {
      /* handled */
    }
  };

  const handleArchive = async (need: NeedRow) => {
    try {
      await runAction(need.id, 'Need archived', async () => {
        const { error } = await supabase
          .from('needs')
          .update({ status: 'closed' as AdminNeedStatus, updated_at: new Date().toISOString() })
          .eq('id', need.id);
        return { error: error as Error | null };
      });
      refreshRow(need.id, { status: 'closed' });
    } catch {
      /* handled */
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('needs').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success('Need deleted');
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Failed to delete need', {
        description: err instanceof Error ? err.message : 'Unexpected error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const openMergeDialog = async (source: NeedRow) => {
    setMergeSource(source);
    setMergeTargetId('');
    setMergeOpen(true);
    try {
      const { data, error } = await supabase
        .from('needs')
        .select<string, NeedRow>(
          'id,title,description,category_id,owner_id,status,vote_count,reward_amount,need_score,pinned,featured_need,created_at,category:categories(id,name),profile:profiles(id,username)'
        )
        .neq('id', source.id)
        .order('vote_count', { ascending: false })
        .limit(50);
      if (error) throw error;
      setMergeCandidates((data ?? []) as NeedRow[]);
    } catch (err) {
      toast.error('Failed to load merge candidates', {
        description: err instanceof Error ? err.message : 'Unexpected error',
      });
      setMergeCandidates([]);
    }
  };

  const handleMerge = async () => {
    if (!mergeSource || !mergeTargetId) return;
    const target = mergeCandidates.find((n) => n.id === mergeTargetId);
    if (!target) {
      toast.error('Select a valid target need');
      return;
    }
    setMerging(true);
    try {
      const newVoteCount = target.vote_count + mergeSource.vote_count;
      const newRewardAmount = target.reward_amount + mergeSource.reward_amount;

      const { error: updateError } = await supabase
        .from('needs')
        .update({
          vote_count: newVoteCount,
          reward_amount: newRewardAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mergeTargetId);

      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from('needs')
        .delete()
        .eq('id', mergeSource.id);

      if (deleteError) throw deleteError;

      setRows((prev) =>
        prev
          .filter((r) => r.id !== mergeSource.id)
          .map((r) =>
            r.id === mergeTargetId
              ? { ...r, vote_count: newVoteCount, reward_amount: newRewardAmount }
              : r
          )
      );
      setTotal((t) => Math.max(0, t - 1));
      toast.success('Needs merged', {
        description: `“${mergeSource.title}” merged into “${target.title}”.`,
      });
      setMergeOpen(false);
      setMergeSource(null);
      setMergeTargetId('');
    } catch (err) {
      toast.error('Failed to merge needs', {
        description: err instanceof Error ? err.message : 'Unexpected error',
      });
    } finally {
      setMerging(false);
    }
  };

  const range = buildRange(safePage, totalPages);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Need Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage, moderate, and curate needs across the platform.
        </p>
      </div>

      {/* Filters + search */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? 'default' : 'outline'}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[220px]">Need</TableHead>
              <TableHead className="min-w-[140px]">Owner</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Votes</TableHead>
              <TableHead className="text-right">Reward</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead>Flags</TableHead>
              <TableHead className="w-[60px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  No needs found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((need) => {
                const isBusy = actionLoadingId === need.id;
                return (
                  <TableRow key={need.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <Link
                          href={`/needs/${need.id}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {need.title}
                        </Link>
                        <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {truncate(need.description ?? '', 80)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {need.profile ? (
                        <Link
                          href={`/u/${need.profile.username}`}
                          className="text-sm hover:underline"
                        >
                          {need.profile.username}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {need.category?.name ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE_VARIANT[need.status]} className="capitalize">
                        {need.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{need.vote_count}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {need.reward_amount > 0 ? `$${need.reward_amount.toLocaleString()}` : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {need.need_score.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {need.pinned && (
                          <Badge variant="secondary" className="gap-1">
                            <Pin className="h-3 w-3" /> Pinned
                          </Badge>
                        )}
                        {need.featured_need && (
                          <Badge variant="default" className="gap-1">
                            <Star className="h-3 w-3" /> Featured
                          </Badge>
                        )}
                        {!need.pinned && !need.featured_need && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={isBusy}
                          >
                            {isBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                            <span className="sr-only">Open actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>

                          {/* Change status (sub-menu via inline select pattern) */}
                          <div className="px-1 py-1">
                            <Select
                              value={need.status}
                              onValueChange={(v) => handleStatusChange(need, v as AdminNeedStatus)}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Change status" />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_VALUES.map((s) => (
                                  <SelectItem key={s} value={s} className="capitalize">
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem onClick={() => handleTogglePinned(need)}>
                            {need.pinned ? (
                              <>
                                <PinOff className="mr-2 h-4 w-4" /> Unpin
                              </>
                            ) : (
                              <>
                                <Pin className="mr-2 h-4 w-4" /> Pin
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleToggleFeatured(need)}>
                            {need.featured_need ? (
                              <>
                                <StarOff className="mr-2 h-4 w-4" /> Unfeature
                              </>
                            ) : (
                              <>
                                <Star className="mr-2 h-4 w-4" /> Feature
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleArchive(need)}>
                            <Archive className="mr-2 h-4 w-4" /> Archive
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => openMergeDialog(need)}>
                            <GitMerge className="mr-2 h-4 w-4" /> Merge duplicates…
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem asChild>
                            <Link href={`/needs/${need.id}`}>
                              <Eye className="mr-2 h-4 w-4" /> View
                              <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setDeleteTarget(need);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete…
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {Math.min(rows.length, PAGE_SIZE)} of {total} needs
          </p>
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={safePage <= 1}
                  className={cn(
                    safePage <= 1 && 'pointer-events-none opacity-50'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    if (safePage > 1) setPage(safePage - 1);
                  }}
                />
              </PaginationItem>

              {range.map((p, i) =>
                p === 'ellipsis' ? (
                  <PaginationItem key={`e-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === safePage}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(p);
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={safePage >= totalPages}
                  className={cn(
                    safePage >= totalPages && 'pointer-events-none opacity-50'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    if (safePage < totalPages) setPage(safePage + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Merge dialog */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Merge duplicates</DialogTitle>
            <DialogDescription>
              Select the need to merge{' '}
              <span className="font-medium text-foreground">“{mergeSource?.title}”</span> into.
              The source&apos;s votes and reward amount will be added to the target, then the
              source will be deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Select value={mergeTargetId} onValueChange={setMergeTargetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target need…" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {mergeCandidates.length === 0 ? (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    No other needs available.
                  </div>
                ) : (
                  mergeCandidates.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.title} · {n.vote_count} votes · ${n.reward_amount}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {mergeTargetId && mergeSource ? (
              <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                {mergeSource.vote_count} votes +{' '}
                {mergeSource.reward_amount > 0
                  ? `$${mergeSource.reward_amount} reward`
                  : 'no reward'}{' '}
                will be transferred.
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeOpen(false)} disabled={merging}>
              Cancel
            </Button>
            <Button onClick={handleMerge} disabled={!mergeTargetId || merging}>
              {merging ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Merging…
                </>
              ) : (
                <>
                  <GitMerge className="mr-2 h-4 w-4" /> Merge &amp; delete source
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete need?</DialogTitle>
            <DialogDescription>
              This permanently deletes{' '}
              <span className="font-medium text-foreground">“{deleteTarget?.title}”</span>. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete need
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
