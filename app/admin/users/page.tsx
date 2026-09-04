'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search,
  Shield,
  BadgeCheck,
  Hammer,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

type SortKey = 'newest' | 'oldest' | 'username';

const PAGE_SIZE = 20;

const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  username: 'Username A-Z',
};

export default function UserManagementPage() {
  const [users, setUsers] = React.useState<Profile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [sort, setSort] = React.useState<SortKey>('newest');
  const [page, setPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [pendingActionId, setPendingActionId] = React.useState<string | null>(null);
  const [adminConfirmTarget, setAdminConfirmTarget] = React.useState<Profile | null>(null);

  // Debounce search input
  React.useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    if (debouncedSearch) {
      query = query.or(
        `username.ilike.%${debouncedSearch}%,full_name.ilike.%${debouncedSearch}%`,
      );
    }

    switch (sort) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'username':
        query = query.order('username', { ascending: true });
        break;
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, error: err, count } = await query;

    if (err) {
      setError(err.message);
      setUsers([]);
      setTotalCount(0);
    } else {
      setUsers((data ?? []) as Profile[]);
      setTotalCount(count ?? 0);
    }

    setLoading(false);
  }, [debouncedSearch, sort, page]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // These three privileged flags can no longer be updated by a direct table
  // write (see supabase/migrations/20260904090000_protect_privileged_profile_columns.sql)
  // -- they now go through admin-only, server-side-checked RPCs
  // (20260904090100_admin_profile_management_functions.sql). The RPC itself
  // is the access control; this page being under /admin is a UX convenience,
  // not the actual security boundary.
  const RPC_BY_FIELD = {
    is_admin: { name: 'admin_set_is_admin', param: 'new_is_admin' },
    verified: { name: 'admin_set_verified', param: 'new_verified' },
    pro_builder: { name: 'admin_set_pro_builder', param: 'new_pro_builder' },
  } as const;

  const patchProfile = async (
    id: string,
    field: 'is_admin' | 'verified' | 'pro_builder',
    next: boolean,
    successMsg: string,
    errorMsg: string,
  ) => {
    setPendingActionId(id);
    const { name, param } = RPC_BY_FIELD[field];
    const { error: err } = await supabase.rpc(name, {
      target_user_id: id,
      [param]: next,
    });
    setPendingActionId(null);

    if (err) {
      toast.error(errorMsg, { description: err.message });
      return;
    }
    toast.success(successMsg);
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, [field]: next } : u)),
    );
  };

  // Admin status is destructive enough (full moderation access) to warrant a
  // confirmation step; verified/Pro Builder stay single-click as before.
  const requestToggleAdmin = (u: Profile) => setAdminConfirmTarget(u);

  const confirmToggleAdmin = () => {
    if (!adminConfirmTarget) return;
    const u = adminConfirmTarget;
    setAdminConfirmTarget(null);
    patchProfile(
      u.id,
      'is_admin',
      !u.is_admin,
      !u.is_admin ? 'Admin access granted' : 'Admin access revoked',
      'Failed to update admin status',
    );
  };

  const toggleVerified = (u: Profile) =>
    patchProfile(
      u.id,
      'verified',
      !u.verified,
      !u.verified ? 'User verified' : 'User unverified',
      'Failed to update verified status',
    );

  const toggleProBuilder = (u: Profile) =>
    patchProfile(
      u.id,
      'pro_builder',
      !u.pro_builder,
      !u.pro_builder ? 'Pro Builder enabled' : 'Pro Builder disabled',
      'Failed to update Pro Builder status',
    );

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const initials = (u: Profile) => {
    const base = u.full_name || u.username || '';
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
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All registered users and their account flags.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {totalCount} user{totalCount === 1 ? '' : 's'} total
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

        <div className="flex items-center gap-2">
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
              <TableHead>User</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Pro Builder</TableHead>
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
                    Loading users…
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-destructive">
                  {error}
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence initial={false}>
                {users.map((u) => (
                  <motion.tr
                    key={u.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    {/* User */}
                    <TableCell className="align-top">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {u.avatar_url ? (
                            <AvatarImage src={u.avatar_url} alt={u.username} />
                          ) : null}
                          <AvatarFallback className="text-xs">
                            {initials(u)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{u.username}</span>
                          {u.full_name && (
                            <span className="text-xs text-muted-foreground">
                              {u.full_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Admin */}
                    <TableCell className="align-top">
                      {u.is_admin ? (
                        <Badge className="gap-1 bg-rose-600 hover:bg-rose-600">
                          <Shield className="h-3 w-3" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          User
                        </Badge>
                      )}
                    </TableCell>

                    {/* Verified */}
                    <TableCell className="align-top">
                      {u.verified ? (
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
                      {u.pro_builder ? (
                        <Badge className="gap-1 bg-indigo-600 hover:bg-indigo-600">
                          <Hammer className="h-3 w-3" /> Pro
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Standard
                        </Badge>
                      )}
                    </TableCell>

                    {/* Joined */}
                    <TableCell className="align-top text-sm text-muted-foreground">
                      {formatDate(u.created_at)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="align-top">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant={u.is_admin ? 'secondary' : 'outline'}
                          onClick={() => requestToggleAdmin(u)}
                          disabled={pendingActionId === u.id}
                          title={u.is_admin ? 'Remove admin' : 'Make admin'}
                        >
                          {pendingActionId === u.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Shield
                              className={cn(
                                'h-3.5 w-3.5',
                                u.is_admin && 'text-rose-600',
                              )}
                            />
                          )}
                          <span className="ml-1">
                            {u.is_admin ? 'Remove Admin' : 'Make Admin'}
                          </span>
                        </Button>

                        <Button
                          size="sm"
                          variant={u.verified ? 'secondary' : 'outline'}
                          onClick={() => toggleVerified(u)}
                          disabled={pendingActionId === u.id}
                          title={u.verified ? 'Unverify' : 'Verify'}
                        >
                          {pendingActionId === u.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <BadgeCheck
                              className={cn(
                                'h-3.5 w-3.5',
                                u.verified && 'text-emerald-600',
                              )}
                            />
                          )}
                          <span className="ml-1">
                            {u.verified ? 'Unverify' : 'Verify'}
                          </span>
                        </Button>

                        <Button
                          size="sm"
                          variant={u.pro_builder ? 'secondary' : 'outline'}
                          onClick={() => toggleProBuilder(u)}
                          disabled={pendingActionId === u.id}
                          title={u.pro_builder ? 'Remove Pro' : 'Make Pro'}
                        >
                          {pendingActionId === u.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Hammer
                              className={cn(
                                'h-3.5 w-3.5',
                                u.pro_builder && 'text-indigo-600',
                              )}
                            />
                          )}
                          <span className="ml-1">
                            {u.pro_builder ? 'Remove Pro' : 'Make Pro'}
                          </span>
                        </Button>

                        <Button asChild size="sm" variant="ghost" title="View profile">
                          <Link href={`/builders/${u.id}`}>
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

      <AlertDialog
        open={adminConfirmTarget !== null}
        onOpenChange={(open) => { if (!open) setAdminConfirmTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {adminConfirmTarget?.is_admin ? 'Remove admin access?' : 'Grant admin access?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {adminConfirmTarget?.is_admin
                ? `@${adminConfirmTarget?.username} will lose full moderation access — approving listings, editing needs/reviews, and everything else under /admin.`
                : `@${adminConfirmTarget?.username} will gain full moderation access — approving listings, editing needs/reviews, and everything else under /admin.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleAdmin}>
              {adminConfirmTarget?.is_admin ? 'Remove admin' : 'Grant admin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
