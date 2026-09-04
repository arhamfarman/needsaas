'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Sparkles, Building2, Loader2, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';

const PLANS = [
  {
    name: 'Free Builder',
    price: '$0',
    period: '',
    description: 'Everything you need to get started',
    cta: 'Get started',
    ctaHref: '/signin?tab=signup',
    highlighted: false,
    features: [
      'First software listing free',
      'Public builder profile',
      'Community participation',
      'Reviews & ratings',
      'Match software to needs',
    ],
  },
  {
    name: 'Pro Builder',
    price: '$15',
    period: '/month or $99/year',
    description: 'For serious builders who want more reach',
    highlighted: true,
    badge: 'Most popular',
    features: [
      'Everything in Free',
      'Unlimited listings — no $10 listing fee',
      'Pro Builder badge',
      'Advanced analytics',
      'NeedScore™ exact scores',
      'Demand-based opportunity matching',
      'Builder Insights',
    ],
  },
  {
    name: 'Enterprise / Agency',
    price: 'Contact Sales',
    period: '',
    description: 'For agencies managing multiple products',
    cta: 'Contact sales',
    ctaHref: "/signin?tab=signup",
    highlighted: false,
    badge: null,
    features: [
      'Everything in Pro',
      'Multi-team management',
      'Bulk listing tools',
      'Custom branding',
      'Dedicated account manager',
      'SLA & priority queue',
    ],
  },
];

export default function PricingPage() {
  const { user, profile } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [checkoutPending, setCheckoutPending] = useState(false);

  const isPro = profile?.pro_builder;

  async function startProCheckout() {
    if (!user) {
      window.location.href = '/signin?tab=signup';
      return;
    }
    if (!profile?.builder_onboarded) {
      window.location.href = '/onboarding/builder';
      return;
    }

    setCheckoutPending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        toast.error('Please sign in again');
        setCheckoutPending(false);
        return;
      }

      const amount = billingCycle === 'monthly' ? 1500 : 9900;
      const productName = billingCycle === 'monthly' ? 'Pro Builder — Monthly' : 'Pro Builder — Annual';
      const plan = billingCycle === 'monthly' ? 'monthly' : 'yearly';

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            mode: 'subscription',
            amount,
            interval: billingCycle === 'monthly' ? 'month' : 'year',
            product_name: productName,
            product_metadata: {
              plan,
              type: 'pro_builder',
            },
            success_url: `${window.location.origin}/dashboard?pro=1`,
            cancel_url: `${window.location.origin}/pricing?cancel=1`,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Checkout failed');
      }

      const data = await response.json();
      const checkoutUrl: string | undefined = data.url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start checkout');
      setCheckoutPending(false);
    }
  }

  return (
    <div className="relative">
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 -z-10 mesh-gradient" />
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-brand/5 blur-[140px]" />

        <div className="mx-auto max-w-5xl px-4 pb-12 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-16 lg:pt-32">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-border/50 bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            Simple, transparent pricing
          </motion.div>

          <h1 className="text-center font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Pricing for every stage
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-muted-foreground">
            Start free. List your first software at no cost. Upgrade when you&apos;re ready for more.
          </p>

          <div className="mx-auto mt-8 flex w-fit items-center gap-1 rounded-xl border border-border/60 bg-card/60 p-1 shadow-soft">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition',
                billingCycle === 'monthly' ? 'bg-brand text-brand-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Monthly — $15
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition',
                billingCycle === 'yearly' ? 'bg-brand text-brand-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Yearly — $99
              <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">Save 45%</span>
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan, i) => {
            const isProPlan = plan.name === 'Pro Builder';
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={cn(
                  'relative flex flex-col rounded-2xl border p-6 transition-all',
                  plan.highlighted
                    ? 'border-brand/30 bg-card shadow-soft-xl ring-1 ring-brand/10'
                    : 'border-border/50 bg-card/50 shadow-soft hover:shadow-soft-lg hover:border-border/80'
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground shadow-soft">
                    {plan.badge}
                  </div>
                )}

                <h3 className="font-display text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

                <div className="mt-5 flex items-baseline gap-1">
                  {isProPlan ? (
                    <>
                      <span className="font-display text-3xl font-bold text-foreground">
                        {billingCycle === 'monthly' ? '$15' : '$99'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /{billingCycle === 'monthly' ? 'month' : 'year'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-display text-3xl font-bold text-foreground">{plan.price}</span>
                      {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
                    </>
                  )}
                </div>

                {isProPlan ? (
                  isPro ? (
                    <div className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-50 py-2.5 text-sm font-medium text-emerald-700">
                      <Crown className="h-4 w-4" /> You are a Pro Builder
                    </div>
                  ) : !profile?.builder_onboarded ? (
                    <Button asChild className="mt-5 w-full bg-brand text-brand-foreground shadow-soft hover:bg-brand/90">
                      <Link href="/onboarding/builder">
                        Become a Builder First <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      onClick={startProCheckout}
                      disabled={checkoutPending}
                      className="mt-5 w-full bg-brand text-brand-foreground shadow-soft hover:bg-brand/90"
                    >
                      {checkoutPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting to checkout…</>
                      ) : (
                        <>Upgrade to Pro <ArrowRight className="ml-2 h-4 w-4" /></>
                      )}
                    </Button>
                  )
                ) : (
                  <Button
                    asChild
                    className={cn('mt-5 w-full', plan.highlighted ? 'bg-brand text-brand-foreground shadow-soft hover:bg-brand/90' : 'shadow-soft')}
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    <Link href={plan.ctaHref as string}>
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}

                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className={cn('mt-0.5 h-4 w-4 shrink-0', plan.highlighted ? 'text-brand' : 'text-emerald-500')} />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-20 rounded-2xl border border-border/50 bg-card/50 p-8 shadow-soft sm:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground">How listings work</h2>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-foreground">1. First listing is free</p>
              <p className="mt-1 text-sm text-muted-foreground">Every new builder gets their first software listing at no cost.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">2. $10 per additional listing</p>
              <p className="mt-1 text-sm text-muted-foreground">After your first listing, each new software costs $10 — a one-time fee.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">3. Pro = unlimited</p>
              <p className="mt-1 text-sm text-muted-foreground">Upgrade to Pro Builder for $15/month and list as many products as you want.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
