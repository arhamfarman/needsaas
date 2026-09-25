'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { ProductForm } from '@/components/forms/product-form';
import { Button } from '@/components/ui/button';
import type { Category } from '@/lib/types';
import {
  ArrowRight, ArrowDown, Package, Share2, Sparkles, CheckCircle2, Users,
} from 'lucide-react';

const BENEFITS = [
  { icon: Package, text: 'Your first product is free' },
  { icon: Sparkles, text: 'Get a real, public product page' },
  { icon: Share2, text: 'Share it on X, LinkedIn, or your own site' },
  { icon: Users, text: 'Help people discover what you built' },
  { icon: CheckCircle2, text: 'Get discovered alongside other software' },
];

export default function SubmitProductPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories((data as Category[]) ?? []));
  }, []);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 -z-10 mesh-gradient" />
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-brand/5 blur-[140px]" />

        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-border/50 bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand" /> For builders
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-3xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl"
          >
            Built something? Give it a home.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            List your SaaS, AI tool, automation, or software product on NeedSaaS and get a real, shareable
            product page you can use anywhere — X, LinkedIn, your own site. It doesn&apos;t need to have started
            as a NeedSaaS Need. If you built it, it belongs here.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-8 grid max-w-md grid-cols-1 gap-2.5 text-left sm:grid-cols-2"
          >
            {BENEFITS.map((b) => (
              <div key={b.text} className="flex items-center gap-2.5 text-sm text-foreground/90">
                <b.icon className="h-4 w-4 shrink-0 text-brand" /> {b.text}
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9"
          >
            <Button size="lg" onClick={scrollToForm} className="group h-12 rounded-xl bg-brand px-7 text-base text-brand-foreground shadow-soft hover:bg-brand/90">
              List Your Product — Free
              <ArrowDown className="ml-2 h-4 w-4 transition group-hover:translate-y-0.5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section ref={formRef} className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
        {authLoading ? null : !user ? (
          <div className="rounded-2xl border border-border/60 bg-card/40 p-8 text-center">
            <h2 className="font-display text-xl font-semibold text-foreground">Sign in to list your product</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Takes a few seconds — then come straight back here to fill out your listing.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
                <Link href="/signin?tab=signup&next=/submit-product">
                  Create a free account <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/signin?next=/submit-product">I already have an account</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="mb-6 font-display text-2xl font-semibold text-foreground">List your product</h2>
            <ProductForm
              categories={categories}
              onDone={(createdProductId) => {
                if (createdProductId) router.push(`/products/${createdProductId}?share=1`);
              }}
            />
          </>
        )}
      </section>
    </div>
  );
}
