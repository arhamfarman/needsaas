'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Lightbulb, Loader2, DollarSign, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESET_AMOUNTS = [10, 25, 50, 100, 250];

const TIMELINE_OPTIONS = [
  { value: '30_days', label: '30 Days' },
  { value: '60_days', label: '60 Days' },
  { value: '90_days', label: '90 Days' },
  { value: 'flexible', label: 'Flexible' },
];

export function NeedForm({ categories, onDone }: { categories: Category[]; onDone: () => void }) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState(searchParams.get('title') || '');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string>('none');
  const [loading, setLoading] = useState(false);

  // Build reward fields
  const [enableReward, setEnableReward] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [timeline, setTimeline] = useState<string>('flexible');
  const [rewardNote, setRewardNote] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (title.trim().length < 8) { toast.error('Title must be at least 8 characters'); return; }
    if (description.trim().length < 20) { toast.error('Please describe your need in at least 20 characters'); return; }

    let contributionAmount: number | null = null;
    if (enableReward) {
      contributionAmount = amount ?? (customAmount ? parseFloat(customAmount) : null);
      if (customAmount) {
        const parsed = parseFloat(customAmount);
        if (isNaN(parsed) || parsed < 1) { toast.error('Custom amount must be at least $1'); return; }
        contributionAmount = parsed;
      }
    }

    setLoading(true);

    // Insert the need first
    const { data: needData, error: needError } = await supabase.from('needs').insert({
      title: title.trim(),
      description: description.trim(),
      category_id: categoryId === 'none' ? null : categoryId,
      timeline: enableReward ? timeline : null,
      reward_note: enableReward && rewardNote.trim() ? rewardNote.trim() : null,
    }).select('id').single();

    if (needError) { setLoading(false); toast.error(needError.message); return; }

    // If reward enabled, insert contribution
    if (enableReward && contributionAmount && contributionAmount > 0 && needData) {
      const { error: contribError } = await supabase.from('contributions').insert({
        need_id: needData.id,
        amount: contributionAmount,
        note: rewardNote.trim() || null,
      });

      if (contribError) {
        toast.error('Need posted, but contribution failed: ' + contribError.message);
      } else {
        toast.success('Need posted with Build Reward!');
      }
    } else {
      toast.success('Need posted! The community can now vote on it.');
    }

    setLoading(false);
    setTitle(''); setDescription(''); setCategoryId('none');
    setEnableReward(false); setAmount(null); setCustomAmount(''); setRewardNote(''); setTimeline('flexible');
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="need-title">What do you need?</Label>
        <Input id="need-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. A simple tool to schedule social posts across platforms" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="need-desc">Describe the problem</Label>
        <Textarea id="need-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are you trying to do? What have you tried? What's missing in existing tools?" rows={5} required />
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No category</SelectItem>
            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Build Reward Section */}
      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <button
          type="button"
          onClick={() => setEnableReward((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            Add a Build Reward (optional)
          </span>
          <span className={cn(
            'relative h-5 w-9 rounded-full transition',
            enableReward ? 'bg-brand' : 'bg-muted-foreground/30'
          )}>
            <span className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-white transition',
              enableReward ? 'left-4' : 'left-0.5'
            )} />
          </span>
        </button>

        {enableReward && (
          <div className="mt-4 space-y-4">
            {/* Contribution amount */}
            <div className="space-y-2">
              <Label className="text-xs">Contribution Amount</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => { setAmount(a); setCustomAmount(''); }}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                      amount === a && !customAmount
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-border/60 bg-white text-muted-foreground hover:border-border hover:text-foreground'
                    )}
                  >
                    ${a}
                  </button>
                ))}
                <div className="relative">
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min="1"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setAmount(null); }}
                    placeholder="Custom"
                    className="w-24 pl-6"
                  />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <Label className="text-xs">Desired Launch Timeline</Label>
              <div className="flex flex-wrap gap-2">
                {TIMELINE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTimeline(t.value)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                      timeline === t.value
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-border/60 bg-white text-muted-foreground hover:border-border hover:text-foreground'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional note */}
            <div className="space-y-2">
              <Label className="text-xs">Optional Note</Label>
              <Textarea
                value={rewardNote}
                onChange={(e) => setRewardNote(e.target.value)}
                placeholder="This would save my business hours every week."
                rows={2}
              />
            </div>

            {/* Reassuring message */}
            <div className="flex gap-2.5 rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-700">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Builders own the software they create.</p>
                <p className="mt-1 text-blue-600/80">
                  Your contribution simply helps encourage someone to build it.
                  If the software launches, contributors receive access according to the builder&apos;s offering.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Button type="submit" disabled={loading} className="bg-brand text-brand-foreground hover:bg-brand/90">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
        Post need
      </Button>
    </form>
  );
}
