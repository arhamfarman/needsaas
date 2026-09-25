'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { NeedForm } from '@/components/forms/need-form';
import type { Category } from '@/lib/types';
import { trackFunnelEvent } from '@/lib/funnel-analytics';
import { Lightbulb, Check } from 'lucide-react';

const BENEFITS = ['Free to post', 'No technical knowledge required', 'Builders can discover your problem'];

// NeedForm reads useSearchParams() (to prefill from a Starter Pack idea or
// a zero-result search query) -- that requires a Suspense boundary or the
// whole route deopts out of static generation, confirmed by the build
// (`/submit-need deopted into client-side rendering`). Same fix already
// used for app/signin and app/reset-password.
function SubmitNeedPageInner() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    trackFunnelEvent('submit_need_view');
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories((data as Category[]) ?? []));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Compact hero -- headline, one sentence, three short bullets, straight into the form */}
      <div className="mb-6 flex items-start gap-3">
        <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand sm:flex">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
            Have a problem you wish someone would solve?
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Tell us what you wish existed. It could be software, an AI agent, an automation, a workflow, or something
            else — you don&apos;t need to know the technical solution, just describe the problem.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-x-4 gap-y-1.5">
        {BENEFITS.map((b) => (
          <span key={b} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 text-emerald-500" /> {b}
          </span>
        ))}
      </div>

      <div className="rounded-2xl border border-border/60 bg-white p-5 shadow-card sm:p-6">
        <NeedForm
          categories={categories}
          onDone={(createdNeedId) => {
            if (createdNeedId) router.push(`/needs/${createdNeedId}?share=1`);
          }}
        />
      </div>
    </div>
  );
}

export default function SubmitNeedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SubmitNeedPageInner />
    </Suspense>
  );
}
