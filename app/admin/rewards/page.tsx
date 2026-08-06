'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search,
  ExternalLink,
  Pencil,
  Loader2,
  Trophy,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpDown,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

type RewardRow = {
  id: string;
  title: string;
  reward_amount: number;
  contributor_count: number;
  vote_count: number;
  need_score: number;
  status: string;
  created_at: string;
};

type SortKey = 'reward' | 'contributors' | 'score' | 'newest';

const SORT_LABELS: Record<SortKey, string> = {
  reward: 'Highest reward',
  contributors: 'Most contributors',
  score: 'Highest NeedScore',
  newest: 'Newest',
};

export default function RewardManagementPage() {
  const [rows, setRows] = React.useState<RewardRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [sort, setSort] = React.useState<SortKey>('reward');

  // Totals across ALL needs with reward (not affected by search/sort)
  const [totalPool, setTotalPool] = React.useState(0);
  const [totalContributors, setTotalContributors] = React.useState(0);

  // Edit dialog
  const [editTarget, setEditTarget] = React.useState<RewardRow | null>(null);
  const [editAmount, setEditAmount] = React.useState('');
  const [editOpen, setEditOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch totals once on mount
  React.useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('needs')
        .select('reward_amount, contributor_count')
        .gt('reward_amount', 0);
      if (error) {
        toast.error('Failed to load reward totals', { description: error.message });
        return;
      }
      const pool = (data ?? []).reduce((s, r) => s + Number(r.reward_amount), 0);
      const contributors = (data ?? []).reduce((s, r) => s + Number(r.contributor_count), 0);
      setTotalPool(pool);
      setTotalContributors(contributors);
    })();
  }, []);

  const fetchRows = React.useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('needs')
        .select<
          string,
          RewardRow
        >('id,title,reward_amount,contributor_count,vote_count,need_score,status,created_at')
        .gt('reward_amount', 0);

      if (debouncedSearch) {
        query = query.ilike('title', `%${debouncedSearch}%`);
      }

      switch (sort) {
        case 'reward':
          query = query.order('reward_amount', { ascending: false });
          break;
        case 'contributors':
          query = query.order('contributor_count', { ascending: false });
          break;
        case 'score':
          query = query.order('need_score', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
      }

      const { data, error } = await query;
      if (error) throw error;
      setRows((data ?? []) as RewardRow[]);
    } catch (err) {
      toast.error('Failed to load rewards', {
        description: err instanceof Error ? err.message : 'Unexpected error',
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sort]);

  React.useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openEdit = (row: RewardRow) => {
    setEditTarget(row);
    setEditAmount(String(row.reward_amount));
    setEditOpen(true);
  };

  const handleSaveAmount = async () => {
    if (!editTarget) return;
    const parsed = Number(editAmount);
    if (Number.isNaN(parsed) || parsed < 0) {
      toast.error('Enter a valid non-negative amount');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('needs')
        .update({ reward_amount: parsed, updated_at: new Date().toISOString() })
        .eq('id', editTarget.id);
      if (error) throw error;

      const delta = parsed - editTarget.reward_amount;
      setRows((prev) =>
        prev.map((r) =>
          r.id === editTarget.id ? { ...r, reward_amount: parsed } : r,
        ),
      );
      setTotalPool((p) => Math.max(0, p + delta));
      toast.success('Reward amount updated', {
        description: `“${editTarget.title}” now has $${parsed.toLocaleString()}.`,
      });
      setEditOpen(false);
      setEditTarget(null);
    } catch (err) {
      toast.error('Failed to update reward', {
        description: err instanceof Error ? err.message : 'Unexpected error',
      });
    } finally {
      setSaving(false);
    }
  };

  const fmtMoney = (n: number) => `$${n.toLocaleString()}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Reward Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track and manage reward-funded needs across the platform.
        </p>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-border/60 bg-card p-5 shadow-card"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <DollarSign className="h-5 w-5" />
          </div>
          <p className="font-display text-2xl font-bold text-foreground">
            {fmtMoney(totalPool)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Total reward pool</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06 }}
          className="rounded-2xl border border-border/60 bg-card p-5 shadow-card"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <p className="font-display text-2xl font-bold text-foreground">
            {totalContributors.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">Total contributors</p>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by need title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-[180px]">
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
              <TableHead className="min-w-[240px]">Need</TableHead>
              <TableHead className="text-right">Reward</TableHead>
              <TableHead className="text-right">Contributors</TableHead>
              <TableHead className="text-right">Votes</TableHead>
              <TableHead className="text-right">NeedScore</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  {debouncedSearch
                    ? 'No rewarded needs match your search.'
                    : 'No needs with rewards yet.'}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/needs/${row.id}`}
                      className="group inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                    >
                      <Trophy className="h-3.5 w-3.5 text-amber-500" />
                      {row.title}
                      <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums text-emerald-600">
                    {fmtMoney(row.reward_amount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.contributor_count}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.vote_count}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      {row.need_score.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="sm" variant="ghost" title="View need">
                        <Link href={`/needs/${row.id}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(row)}
                        title="Edit reward amount"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {rows.length > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          Showing {rows.length} rewarded need{rows.length === 1 ? '' : 's'}.
        </p>
      )}

      {/* Edit reward dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit reward amount</DialogTitle>
            <DialogDescription>
              Update the reward for{' '}
              <span className="font-medium text-foreground">“{editTarget?.title}”</span>.
              Current: {editTarget ? fmtMoney(editTarget.reward_amount) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="reward-amount">Reward amount (USD)</Label>
            <Input
              id="reward-amount"
              type="number"
              min={0}
              step="any"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Set to 0 to remove the reward from this need.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveAmount} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                'Save amount'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
