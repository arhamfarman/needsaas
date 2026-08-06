'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Need } from '@/lib/types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Lightbulb, Link2, Check, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NeedMatchDialog({
  productId,
  description,
  open,
  onOpenChange,
}: {
  productId: string;
  description: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [matches, setMatches] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !description) return;
    setLoading(true);

    async function findMatches() {
      // Extract keywords from description (top words by frequency, excluding common words)
      const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'must', 'can', 'to', 'of', 'in', 'for',
        'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
        'before', 'after', 'above', 'below', 'between', 'under', 'again',
        'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
        'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
        'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
        'and', 'but', 'or', 'if', 'because', 'until', 'while', 'about',
        'against', 'between', 'into', 'during', 'this', 'that', 'these',
        'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them',
        'their', 'what', 'which', 'who', 'whom', 'whose', 'my', 'your',
        'his', 'her', 'its', 'our', 'product', 'software', 'tool', 'platform',
        'app', 'application', 'service', 'helps', 'help', 'allow', 'allows',
        'enables', 'users', 'user', 'also', 'like', 'need', 'needs',
      ]);

      const words = description
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 2 && !stopWords.has(w));

      const wordFreq = new Map<string, number>();
      words.forEach((w) => wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1));
      const topWords = Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([w]) => w);

      if (topWords.length === 0) {
        setLoading(false);
        return;
      }

      // Search needs matching any of the top keywords
      const orFilter = topWords.map((w) => `title.ilike.%${w}%`).join(',');
      const { data: needData } = await supabase
        .from('needs')
        .select(`*, category:categories(*)`)
        .or(orFilter)
        .order('vote_count', { ascending: false })
        .limit(8);

      setMatches((needData as Need[]) ?? []);

      // Check which needs are already linked
      const { data: links } = await supabase
        .from('need_product_links')
        .select('need_id')
        .eq('product_id', productId);
      setLinkedIds(new Set((links ?? []).map((l: any) => l.need_id)));

      setLoading(false);
    }

    findMatches();
  }, [open, description, productId]);

  async function attach(needId: string) {
    setPending(needId);
    const { error } = await supabase.from('need_product_links').insert({
      need_id: needId,
      product_id: productId,
    });
    setPending(null);
    if (error) {
      if (error.code === '23505') toast.error('Already linked to this need');
      else toast.error(error.message);
      return;
    }
    toast.success('Software linked to need');
    setLinkedIds((prev) => new Set(prev).add(needId));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand" />
            AI-suggested needs
          </DialogTitle>
          <DialogDescription>
            Based on your description, we found needs your software might solve. Link them with one click.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : matches.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 px-4 py-8 text-center">
            <Lightbulb className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No matching needs found right now. Check back later as the community posts more.
            </p>
          </div>
        ) : (
          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {matches.map((n) => {
              const linked = linkedIds.has(n.id);
              return (
                <div
                  key={n.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 p-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/needs/${n.id}`} className="truncate text-sm font-medium text-foreground hover:text-brand">
                      {n.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {n.vote_count} {n.vote_count === 1 ? 'vote' : 'votes'}
                      {n.category && ` · ${n.category.name}`}
                    </p>
                  </div>
                  {linked ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                      <Check className="h-3.5 w-3.5" /> Linked
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending === n.id}
                      onClick={() => attach(n.id)}
                      className="shrink-0"
                    >
                      {pending === n.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Link2 className="mr-1 h-3.5 w-3.5" /> Link
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-border/40 pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
          <Button asChild size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
            <Link href={`/products/${productId}`}>
              View listing <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
