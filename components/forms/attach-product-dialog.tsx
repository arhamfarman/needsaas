'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Link2, Check, Loader2 } from 'lucide-react';
import type { Product, Need } from '@/lib/types';

export function AttachProductDialog({ need }: { need: Need }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    Promise.all([
      supabase.from('products').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
      supabase.from('need_product_links').select('product_id').eq('need_id', need.id),
    ]).then(([p, l]) => {
      setProducts((p.data as Product[]) ?? []);
      setLinkedIds(new Set((l.data ?? []).map((r) => r.product_id)));
      setLoading(false);
    });
  }, [open, user, need.id]);

  async function attach(productId: string) {
    if (!user) return;
    setPending(productId);
    const { error } = await supabase.from('need_product_links').insert({
      need_id: need.id,
      product_id: productId,
      owner_id: user.id,
    });
    setPending(null);
    if (error) {
      if (error.code === '23505') toast.error('Already attached');
      else toast.error(error.message);
      return;
    }
    toast.success('Software attached to this need');
    setLinkedIds((prev) => new Set(prev).add(productId));
  }

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Link2 className="mr-1.5 h-3.5 w-3.5" /> Attach product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Attach software to this need</DialogTitle>
        </DialogHeader>
        <p className="-mt-2 text-sm text-muted-foreground">Link one of your software listings as a solution to &ldquo;{need.title}&rdquo;.</p>
        <div className="mt-2 space-y-2">
          {loading ? (
            <><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></>
          ) : products.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/60 px-4 py-6 text-center text-sm text-muted-foreground">
              You don&apos;t have any software yet. List one first.
            </p>
          ) : (
            products.map((p) => {
              const linked = linkedIds.has(p.id);
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand/10 text-xs font-bold text-brand ring-1 ring-brand/20">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.tagline}</p>
                  </div>
                  {linked ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                      <Check className="h-3.5 w-3.5" /> Linked
                    </span>
                  ) : (
                    <Button size="sm" variant="outline" disabled={pending === p.id} onClick={() => attach(p.id)}>
                      {pending === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Attach'}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
