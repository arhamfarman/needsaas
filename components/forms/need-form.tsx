'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import type { Category, Need, WhoFor, SolutionType, PainLevel } from '@/lib/types';
import { WHO_FOR_LABELS, SOLUTION_TYPE_LABELS, PAIN_LEVEL_LABELS, NEED_INDUSTRIES } from '@/lib/types';
import { suggestSolutionType } from '@/lib/need-classifier';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Lightbulb, Loader2, DollarSign, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESET_AMOUNTS = [10, 25, 50, 100, 250];

// Pledges aren't backed by a real payment today (see the `contributions`
// insert below) -- capping the amount keeps a single pledge from displaying
// as an implausible number (e.g. "$500,000 reward") on a public Need page.
const PLEDGE_MAX = 1000;

const TIMELINE_OPTIONS = [
  { value: '30_days', label: '30 Days' },
  { value: '60_days', label: '60 Days' },
  { value: '90_days', label: '90 Days' },
  { value: 'flexible', label: 'Flexible' },
];

const WHO_FOR_OPTIONS: WhoFor[] = ['myself', 'my_business', 'my_team', 'my_customers', 'other'];
const SOLUTION_TYPE_OPTIONS: SolutionType[] = ['saas', 'ai_agent', 'ai_tool', 'automation', 'internal_tool', 'other'];
const PAIN_LEVEL_OPTIONS: PainLevel[] = ['nice_to_have', 'significant_time_savings', 'important', 'critical'];

export function NeedForm({
  categories,
  onDone,
  need,
}: {
  categories: Category[];
  onDone: (createdNeedId?: string) => void;
  /** When provided, the form edits this existing Need instead of creating a new one. */
  need?: Need;
}) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const isEditing = !!need;

  // The primary field is the open problem description -- prefilled from a
  // shared "idea" prompt (Starter Packs) or a zero-result search query,
  // both of which read as full sentences, not short titles.
  const [description, setDescription] = useState(need?.description ?? searchParams.get('title') ?? '');
  const [title, setTitle] = useState(need?.title ?? '');
  const [categoryId, setCategoryId] = useState<string>(need?.category_id ?? 'none');

  const [whoFor, setWhoFor] = useState<WhoFor | ''>(need?.who_for ?? '');
  const [industry, setIndustry] = useState(need?.industry ?? '');
  const [customIndustry, setCustomIndustry] = useState(need && need.industry && !NEED_INDUSTRIES.includes(need.industry) ? need.industry : '');
  const [currentSolution, setCurrentSolution] = useState(need?.current_solution ?? '');
  const [painLevel, setPainLevel] = useState<PainLevel | ''>(need?.pain_level ?? '');
  const [desiredOutcome, setDesiredOutcome] = useState(need?.desired_outcome ?? '');
  const [solutionType, setSolutionType] = useState<SolutionType | ''>(need?.solution_type ?? '');
  const [solutionTypeTouched, setSolutionTypeTouched] = useState(isEditing);

  const [loading, setLoading] = useState(false);

  // Build reward / pledge fields
  const [enableReward, setEnableReward] = useState(isEditing ? (need?.reward_amount ?? 0) > 0 : false);
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [timeline, setTimeline] = useState<string>(need?.timeline ?? 'flexible');
  const [rewardNote, setRewardNote] = useState(need?.reward_note ?? '');

  // Suggest a solution type from the problem description -- a plain
  // keyword heuristic (lib/need-classifier.ts), not an AI call. Only
  // auto-fills until the submitter picks one themselves, never overrides
  // a manual choice.
  useEffect(() => {
    if (solutionTypeTouched) return;
    const suggestion = suggestSolutionType(title, description);
    if (suggestion) setSolutionType(suggestion);
  }, [title, description, solutionTypeTouched]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (description.trim().length < 20) { toast.error('Please describe your need in at least 20 characters'); return; }
    if (title.trim().length < 8) { toast.error('Give your need a short title (at least 8 characters)'); return; }

    let contributionAmount: number | null = null;
    if (enableReward && !isEditing) {
      contributionAmount = amount ?? (customAmount ? parseFloat(customAmount) : null);
      if (customAmount) {
        const parsed = parseFloat(customAmount);
        if (isNaN(parsed) || parsed < 1) { toast.error('Custom amount must be at least $1'); return; }
        contributionAmount = parsed;
      }
      if (contributionAmount && contributionAmount > PLEDGE_MAX) {
        toast.error(`Pledges are capped at $${PLEDGE_MAX} for now`);
        return;
      }
    }

    setLoading(true);

    const finalIndustry = industry === 'Other' ? (customIndustry.trim() || null) : (industry || null);

    const needData = {
      title: title.trim(),
      description: description.trim(),
      category_id: categoryId === 'none' ? null : categoryId,
      who_for: whoFor || null,
      industry: finalIndustry,
      solution_type: solutionType || null,
      current_solution: currentSolution.trim() || null,
      pain_level: painLevel || null,
      desired_outcome: desiredOutcome.trim() || null,
    };

    if (isEditing) {
      const { error } = await supabase.from('needs').update(needData).eq('id', need.id);
      setLoading(false);
      if (error) { toast.error('Could not save changes: ' + error.message); return; }
      toast.success('Need updated');
      onDone();
      return;
    }

    // Insert the need first
    const { data: needResult, error: needError } = await supabase.from('needs').insert({
      ...needData,
      timeline: enableReward ? timeline : null,
      reward_note: enableReward && rewardNote.trim() ? rewardNote.trim() : null,
    }).select('id').single();

    if (needError) { setLoading(false); toast.error(needError.message); return; }

    // If a pledge was entered, insert the pledge -- see the disclaimer below:
    // this is never charged, it's a non-binding demand signal.
    if (enableReward && contributionAmount && contributionAmount > 0 && needResult) {
      const { error: contribError } = await supabase.from('contributions').insert({
        need_id: needResult.id,
        amount: contributionAmount,
        note: rewardNote.trim() || null,
      });

      if (contribError) {
        toast.error('Need posted, but the pledge failed: ' + contribError.message);
      } else {
        toast.success('Need posted with a pledge!');
      }
    } else {
      toast.success('Need posted! Others can now support it.');
    }

    const createdId = needResult?.id;
    setLoading(false);
    setTitle(''); setDescription(''); setCategoryId('none');
    setWhoFor(''); setIndustry(''); setCustomIndustry(''); setCurrentSolution('');
    setPainLevel(''); setDesiredOutcome(''); setSolutionType(''); setSolutionTypeTouched(false);
    setEnableReward(false); setAmount(null); setCustomAmount(''); setRewardNote(''); setTimeline('flexible');
    onDone(createdId);
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="need-desc">What do you need?</Label>
        <p className="text-xs text-muted-foreground">
          Describe the problem you want solved. Don&apos;t worry about the technical solution — just explain what
          you want to accomplish.
        </p>
        <Textarea
          id="need-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='e.g. "I run a cleaning company and our staff send job completion photos through WhatsApp. I want a system that automatically organizes the photos and sends a professional completion report to the client."'
          rows={5}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="need-title">Give your need a short, specific title</Label>
        <Input id="need-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Automated cleaning job completion reports" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Who is this for?</Label>
          <Select value={whoFor} onValueChange={(v) => setWhoFor(v as WhoFor)}>
            <SelectTrigger><SelectValue placeholder="Choose one" /></SelectTrigger>
            <SelectContent>
              {WHO_FOR_OPTIONS.map((w) => <SelectItem key={w} value={w}>{WHO_FOR_LABELS[w]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Industry</Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger><SelectValue placeholder="Choose an industry" /></SelectTrigger>
            <SelectContent>
              {NEED_INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
          {industry === 'Other' && (
            <Input value={customIndustry} onChange={(e) => setCustomIndustry(e.target.value)} placeholder="Your industry" className="mt-2" />
          )}
        </div>
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

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-brand" /> Possible solution type
        </Label>
        <p className="text-xs text-muted-foreground">
          Our best guess based on what you wrote — change it if it&apos;s off, or leave it if you&apos;re not sure.
        </p>
        <div className="flex flex-wrap gap-2">
          {SOLUTION_TYPE_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setSolutionType(t); setSolutionTypeTouched(true); }}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                solutionType === t
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border/60 bg-white text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              {SOLUTION_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <details className="group rounded-xl border border-border/60 bg-muted/10 p-4">
        <summary className="cursor-pointer text-sm font-medium text-foreground">
          A few more details <span className="font-normal text-muted-foreground">(optional, helps builders)</span>
        </summary>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="need-current">What do you currently use to solve this problem?</Label>
            <Input id="need-current" value={currentSolution} onChange={(e) => setCurrentSolution(e.target.value)} placeholder="e.g. A shared spreadsheet and a lot of copy-pasting" />
          </div>
          <div className="space-y-2">
            <Label>How much of a problem is this?</Label>
            <Select value={painLevel} onValueChange={(v) => setPainLevel(v as PainLevel)}>
              <SelectTrigger><SelectValue placeholder="Choose one" /></SelectTrigger>
              <SelectContent>
                {PAIN_LEVEL_OPTIONS.map((p) => <SelectItem key={p} value={p}>{PAIN_LEVEL_LABELS[p]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="need-outcome">What would a successful solution let you do?</Label>
            <Textarea id="need-outcome" value={desiredOutcome} onChange={(e) => setDesiredOutcome(e.target.value)} placeholder="e.g. Employees submit photos once and the client automatically receives a branded report." rows={2} />
          </div>
        </div>
      </details>

      {/* Build Reward / Pledge Section */}
      {!isEditing && (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <button
            type="button"
            onClick={() => setEnableReward((v) => !v)}
            className="flex w-full items-center justify-between"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Optional pledge
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
              <div className="space-y-2">
                <Label className="text-xs">Pledge Amount</Label>
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
                      max={PLEDGE_MAX}
                      value={customAmount}
                      onChange={(e) => { setCustomAmount(e.target.value); setAmount(null); }}
                      placeholder="Custom"
                      className="w-24 pl-6"
                    />
                  </div>
                </div>
              </div>

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

              <div className="space-y-2">
                <Label className="text-xs">Optional Note</Label>
                <Textarea
                  value={rewardNote}
                  onChange={(e) => setRewardNote(e.target.value)}
                  placeholder="This would save my business hours every week."
                  rows={2}
                />
              </div>

              <div className="flex gap-2.5 rounded-lg bg-blue-50 p-3 text-xs leading-relaxed text-blue-700">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Pledges are not charged at this time.</p>
                  <p className="mt-1 text-blue-600/80">
                    This is a demand signal, not a payment — NeedSaaS doesn&apos;t charge your card or collect funds
                    for a pledge. It shows builders how much interest is backing this Need. If it launches, how a
                    reward is actually collected and paid out is between the builder and pledgers, not handled by
                    NeedSaaS today.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
        {isEditing ? (loading ? 'Saving...' : 'Save changes') : 'Post need'}
      </Button>
    </form>
  );
}
