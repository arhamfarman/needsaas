'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import type { Category, Need, WhoFor, SolutionType, PainLevel } from '@/lib/types';
import { WHO_FOR_LABELS, SOLUTION_TYPE_LABELS, PAIN_LEVEL_LABELS, NEED_INDUSTRIES } from '@/lib/types';
import { suggestSolutionType, suggestTitle } from '@/lib/need-classifier';
import { saveDraft, loadDraft, clearDraft } from '@/lib/form-draft';
import { trackFunnelEvent } from '@/lib/funnel-analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Lightbulb, Loader2, PencilLine, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const WHO_FOR_OPTIONS: WhoFor[] = ['myself', 'my_business', 'my_team', 'my_customers', 'other'];
const SOLUTION_TYPE_OPTIONS: SolutionType[] = ['saas', 'ai_agent', 'ai_tool', 'automation', 'internal_tool', 'other'];
const PAIN_LEVEL_OPTIONS: PainLevel[] = ['nice_to_have', 'significant_time_savings', 'important', 'critical'];
const PAIN_LEVEL_SHORT: Record<PainLevel, string> = {
  nice_to_have: 'A little',
  significant_time_savings: 'Annoying',
  important: 'A big problem',
  critical: 'Critical',
};

type Draft = {
  description: string; title: string; titleTouched: boolean; categoryId: string;
  whoFor: WhoFor | ''; industry: string; customIndustry: string; currentSolution: string;
  painLevel: PainLevel | ''; desiredOutcome: string; solutionType: SolutionType | ''; solutionTypeTouched: boolean;
};

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEditing = !!need;
  const draftKey = 'need';

  // The primary field is the open problem description -- prefilled from a
  // shared "idea" prompt (Starter Packs) or a zero-result search query,
  // both of which read as full sentences, not short titles.
  const [description, setDescription] = useState(need?.description ?? searchParams.get('title') ?? '');
  const [title, setTitle] = useState(need?.title ?? '');
  const [titleTouched, setTitleTouched] = useState(isEditing);
  const [categoryId, setCategoryId] = useState<string>(need?.category_id ?? 'none');

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [whoFor, setWhoFor] = useState<WhoFor | ''>(need?.who_for ?? '');
  const [industry, setIndustry] = useState(need?.industry ?? '');
  const [customIndustry, setCustomIndustry] = useState(need && need.industry && !NEED_INDUSTRIES.includes(need.industry) ? need.industry : '');
  const [currentSolution, setCurrentSolution] = useState(need?.current_solution ?? '');
  const [painLevel, setPainLevel] = useState<PainLevel | ''>(need?.pain_level ?? '');
  const [desiredOutcome, setDesiredOutcome] = useState(need?.desired_outcome ?? '');
  const [solutionType, setSolutionType] = useState<SolutionType | ''>(need?.solution_type ?? '');
  const [solutionTypeTouched, setSolutionTypeTouched] = useState(isEditing);

  const [loading, setLoading] = useState(false);
  const startedRef = useRef(false);
  const restoredRef = useRef(false);

  // Restore a pre-auth draft once, on mount -- never in edit mode.
  useEffect(() => {
    if (isEditing || restoredRef.current) return;
    restoredRef.current = true;
    const draft = loadDraft<Draft>(draftKey);
    if (!draft) return;
    setDescription(draft.description);
    setTitle(draft.title);
    setTitleTouched(draft.titleTouched);
    setCategoryId(draft.categoryId);
    setWhoFor(draft.whoFor);
    setIndustry(draft.industry);
    setCustomIndustry(draft.customIndustry);
    setCurrentSolution(draft.currentSolution);
    setPainLevel(draft.painLevel);
    setDesiredOutcome(draft.desiredOutcome);
    setSolutionType(draft.solutionType);
    setSolutionTypeTouched(draft.solutionTypeTouched);
    if (draft.whoFor || draft.industry || draft.currentSolution || draft.painLevel || draft.desiredOutcome) setDetailsOpen(true);
    clearDraft(draftKey);
    toast.success('Welcome back — your Need is ready to post.');
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing && description.trim().length > 0 && !startedRef.current) {
      startedRef.current = true;
      trackFunnelEvent('submit_need_started');
    }
  }, [description, isEditing]);

  // Suggest a title from the problem description -- a plain deterministic
  // heuristic (lib/need-classifier.ts), not an AI call. Only auto-fills
  // until the submitter edits it themselves, never overrides a manual edit.
  useEffect(() => {
    if (titleTouched) return;
    if (description.trim().length < 20) return;
    const suggestion = suggestTitle(description);
    if (suggestion) setTitle(suggestion);
  }, [description, titleTouched]);

  // Suggest a solution type from the same text -- same heuristic pattern.
  useEffect(() => {
    if (solutionTypeTouched) return;
    const suggestion = suggestSolutionType(title, description);
    if (suggestion) setSolutionType(suggestion);
  }, [title, description, solutionTypeTouched]);

  function currentDraft(): Draft {
    return {
      description, title, titleTouched, categoryId, whoFor, industry, customIndustry,
      currentSolution, painLevel, desiredOutcome, solutionType, solutionTypeTouched,
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    trackFunnelEvent('submit_need_submit_clicked');
    if (description.trim().length < 20) { toast.error('A couple sentences is enough — just tell us what you wish existed.'); return; }

    // Defer auth to this point, not page load -- preserve everything typed
    // so far and pick back up here once signed in (?next= already exists).
    if (!user) {
      trackFunnelEvent('submit_need_auth_required');
      saveDraft(draftKey, currentDraft());
      router.push(`/signin?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const finalTitle = (title.trim() || suggestTitle(description) || description.trim().slice(0, 60)).slice(0, 120);
    if (finalTitle.trim().length < 4) { toast.error('Add a couple more words to your problem description so we can title it.'); return; }

    setLoading(true);

    const finalIndustry = industry === 'Other' ? (customIndustry.trim() || null) : (industry || null);

    const needData = {
      title: finalTitle,
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

    const { data: needResult, error: needError } = await supabase.from('needs').insert(needData).select('id').single();

    setLoading(false);
    if (needError) { toast.error(needError.message); return; }

    toast.success('Your Need is live!');
    trackFunnelEvent('submit_need_created', { need_id: needResult?.id });

    const createdId = needResult?.id;
    setDescription(''); setTitle(''); setTitleTouched(false); setCategoryId('none');
    setWhoFor(''); setIndustry(''); setCustomIndustry(''); setCurrentSolution('');
    setPainLevel(''); setDesiredOutcome(''); setSolutionType(''); setSolutionTypeTouched(false);
    setDetailsOpen(false);
    onDone(createdId);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="need-desc" className="text-base font-semibold text-foreground">What problem do you wish someone would solve?</Label>
        <Textarea
          id="need-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='Example: I run a cleaning company and our staff send job-completion photos through WhatsApp. I wish there were a simple way to automatically organize the photos and send a professional completion report to the client.'
          rows={5}
          required
          className="text-base"
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          You don&apos;t need to know what technology should solve it. Just tell us what you wish were easier.
        </p>
      </div>

      {description.trim().length >= 20 && (
        <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="need-title" className="text-xs text-muted-foreground">Suggested title</Label>
            {!titleTouched && <span className="text-[11px] text-muted-foreground/70">You can edit this</span>}
          </div>
          <Input
            id="need-title"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setTitleTouched(true); }}
            placeholder="A short, specific title"
            className="border-0 bg-transparent px-0 text-sm font-medium shadow-none focus-visible:ring-0"
          />
        </div>
      )}

      <details
        className="group rounded-xl border border-border/60"
        open={detailsOpen}
        onToggle={(e) => {
          const open = (e.target as HTMLDetailsElement).open;
          if (open && !detailsOpen) trackFunnelEvent('submit_need_optional_details_opened');
          setDetailsOpen(open);
        }}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-medium text-foreground">
          Want to help builders understand the opportunity? <span className="font-normal text-muted-foreground">(optional)</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
        </summary>
        <div className="space-y-4 border-t border-border/60 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm">Who is this for?</Label>
              <Select value={whoFor} onValueChange={(v) => setWhoFor(v as WhoFor)}>
                <SelectTrigger><SelectValue placeholder="Choose one" /></SelectTrigger>
                <SelectContent>
                  {WHO_FOR_OPTIONS.map((w) => <SelectItem key={w} value={w}>{WHO_FOR_LABELS[w]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Industry</Label>
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
            <Label className="text-sm">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="need-current" className="text-sm">How do you handle this today?</Label>
            <Input id="need-current" value={currentSolution} onChange={(e) => setCurrentSolution(e.target.value)} placeholder="e.g. A shared spreadsheet and a lot of copy-pasting" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">How much of a problem is this?</Label>
            <div className="flex flex-wrap gap-2">
              {PAIN_LEVEL_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPainLevel(p)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                    painLevel === p
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border/60 bg-white text-muted-foreground hover:border-border hover:text-foreground'
                  )}
                >
                  {PAIN_LEVEL_SHORT[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="need-outcome" className="text-sm">What would you like this to do for you?</Label>
            <Textarea id="need-outcome" value={desiredOutcome} onChange={(e) => setDesiredOutcome(e.target.value)} placeholder="e.g. Employees submit photos once and the client automatically receives a branded report." rows={2} />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Possible solution type</Label>
            <p className="text-xs text-muted-foreground">Our best guess based on what you wrote — change it if it&apos;s off.</p>
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
        </div>
      </details>

      <div>
        <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isEditing ? <PencilLine className="mr-2 h-4 w-4" /> : <Lightbulb className="mr-2 h-4 w-4" />}
          {isEditing ? (loading ? 'Saving...' : 'Save changes') : (loading ? 'Posting...' : 'Post this Need')}
        </Button>
        {!isEditing && (
          <p className="mt-2 text-xs text-muted-foreground">Free. No commitment. You&apos;re simply telling builders what you need.</p>
        )}
      </div>
    </form>
  );
}
