'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ProductForm } from '@/components/forms/product-form';
import type { Category } from '@/lib/types';
import { trackFunnelEvent } from '@/lib/funnel-analytics';
import { Package, Check } from 'lucide-react';

const BENEFITS = ['First listing free', 'Get a public product page', 'Share it on X, LinkedIn, Reddit, or your website'];

export default function SubmitProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    trackFunnelEvent('submit_product_view');
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories((data as Category[]) ?? []));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Compact hero -- headline, one sentence, three short bullets, straight into the form */}
      <div className="mb-6 flex items-start gap-3">
        <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand sm:flex">
          <Package className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
            Showcase what you&apos;ve built.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            List your SaaS, AI agent, automation, workflow, or software product on NeedSaaS and get a public page you
            can share anywhere.
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
        <ProductForm
          categories={categories}
          onDone={(createdProductId) => {
            if (createdProductId) router.push(`/products/${createdProductId}?share=1`);
          }}
        />
      </div>
    </div>
  );
}
