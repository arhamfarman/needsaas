'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Package,
  Star,
  Link2,
  Rocket,
  User,
  Globe,
  Github,
  Twitter,
  Linkedin,
  MapPin,
  Image as ImageIcon,
  Check,
  LogIn,
  Loader2,
} from 'lucide-react';

type Step = 'intro' | 'profile' | 'social' | 'categories' | 'review';

const STEPS: { key: Step; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'social', label: 'Links' },
  { key: 'categories', label: 'Categories' },
  { key: 'review', label: 'Review' },
];

const STEP_ORDER: Step[] = ['intro', 'profile', 'social', 'categories', 'review'];

type FormData = {
  full_name: string;
  avatar_url: string;
  cover_url: string;
  bio: string;
  website: string;
  github: string;
  twitter: string;
  linkedin: string;
  country: string;
  category_ids: string[];
};

const EMPTY_FORM: FormData = {
  full_name: '',
  avatar_url: '',
  cover_url: '',
  bio: '',
  website: '',
  github: '',
  twitter: '',
  linkedin: '',
  country: '',
  category_ids: [],
};

export default function BuilderOnboardingPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('intro');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load categories
  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('name')
      .then(({ data }) => {
        if (data) setCategories(data as Category[]);
        setCategoriesLoading(false);
      });
  }, []);

  // Prefill form from existing profile data
  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        full_name: profile.full_name ?? '',
        avatar_url: profile.avatar_url ?? '',
        cover_url: profile.cover_url ?? '',
        bio: profile.bio ?? '',
        website: profile.website ?? '',
        github: profile.github ?? '',
        twitter: profile.twitter ?? '',
        linkedin: profile.linkedin ?? '',
        country: profile.country ?? '',
      }));
    }
  }, [profile]);

  // Access control: redirect already-onboarded builders
  useEffect(() => {
    if (!loading && user && profile?.builder_onboarded) {
      router.replace('/dashboard?tab=builder');
    }
  }, [loading, user, profile, router]);

  const setField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  const validateProfileStep = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.full_name.trim()) next.full_name = 'A name is required to continue.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const next = () => {
    if (step === 'profile' && !validateProfileStep()) return;
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
  };

  const back = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  };

  const goToStep = (s: Step) => setStep(s);

  // Toggle a category selection
  const toggleCategory = (id: string) => {
    setForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(id)
        ? prev.category_ids.filter((c) => c !== id)
        : [...prev.category_ids, id],
    }));
  };

  // Persist profile + categories, mark onboarded
  const handleSubmit = async () => {
    if (!user) return;
    if (!form.full_name.trim()) {
      toast.error('Please enter a name before finishing.');
      setStep('profile');
      return;
    }
    setSubmitting(true);
    try {
      // Normalize optional URL-ish fields (trim; leave bare handles for socials)
      const payload = {
        full_name: form.full_name.trim(),
        avatar_url: form.avatar_url.trim() || null,
        cover_url: form.cover_url.trim() || null,
        bio: form.bio.trim() || null,
        website: form.website.trim() || null,
        github: form.github.trim() || null,
        twitter: form.twitter.trim() || null,
        linkedin: form.linkedin.trim() || null,
        country: form.country.trim() || null,
        builder_onboarded: true,
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Sync builder_categories junction: replace existing with the new selection
      const { error: delError } = await supabase
        .from('builder_categories')
        .delete()
        .eq('builder_id', user.id);
      if (delError) throw delError;

      if (form.category_ids.length > 0) {
        const rows = form.category_ids.map((cid) => ({
          builder_id: user.id,
          category_id: cid,
        }));
        const { error: insError } = await supabase
          .from('builder_categories')
          .insert(rows);
        if (insError) throw insError;
      }

      await refreshProfile();
      toast.success("You're a Builder now! Welcome aboard.");
      router.push('/dashboard?tab=builder');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      toast.error(msg);
      setSubmitting(false);
    }
  };

  // Skip: just mark onboarded, no profile edits
  const handleSkip = async () => {
    if (!user) return;
    setSkipping(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ builder_onboarded: true })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Skipped for now — you can finish your profile anytime.');
      router.push('/dashboard?tab=builder');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      toast.error(msg);
      setSkipping(false);
    }
  };

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-brand" />
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  // ---- Not signed in ----
  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-border/60 bg-white p-8 text-center shadow-card sm:p-10"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
            <LogIn className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Sign in to become a Builder
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You need an account to complete Builder onboarding and start publishing software.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link href="/signin?tab=signin">Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/signin?tab=signup">Create an account</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentStepIndex = STEP_ORDER.indexOf(step);
  const isFormStep = step !== 'intro';
  const progressValue = isFormStep
    ? ((STEP_ORDER.indexOf(step) - 1) / (STEPS.length - 1)) * 100
    : 0;

  return (
    <div className="relative min-h-[80vh] overflow-hidden px-4 py-10 sm:px-6 lg:py-16">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[400px] rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-2xl">
        {/* Minimal standalone header (logo only) */}
        <div className="mb-8 flex items-center justify-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-foreground">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">
              NeedSaaS
            </span>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {/* ---------- INTRO ---------- */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <CardShell>
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand to-brand/70 text-brand-foreground shadow-lg shadow-brand/20"
                  >
                    <Rocket className="h-10 w-10" />
                  </motion.div>

                  <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    You&apos;re about to become a Builder.
                  </h1>
                  <p className="mt-4 max-w-md text-base text-muted-foreground">
                    Builders can publish software, receive reviews, connect software to
                    Needs, and grow their audience.
                  </p>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <FeaturePill icon={Package} title="Publish" desc="List your software" />
                  <FeaturePill icon={Star} title="Reviews" desc="Earn ratings" />
                  <FeaturePill icon={Link2} title="Connect" desc="Match Needs" />
                </div>

                <div className="mt-8 rounded-2xl border border-brand/15 bg-brand/5 p-4 text-center">
                  <p className="text-sm font-medium text-foreground">
                    Complete your Builder Profile to continue.
                  </p>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <Button
                    size="lg"
                    className="bg-brand text-brand-foreground hover:bg-brand/90"
                    onClick={() => setStep('profile')}
                  >
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    disabled={skipping}
                    className="text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                  >
                    {skipping ? 'Skipping…' : 'Skip for now'}
                  </button>
                </div>
              </CardShell>
            </motion.div>
          )}

          {/* ---------- FORM STEPS ---------- */}
          {isFormStep && (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {/* Progress indicator */}
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  {STEPS.map((s, i) => {
                    const active = STEP_ORDER.indexOf(step) - 1 === i;
                    const done = STEP_ORDER.indexOf(step) - 1 > i;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => goToStep(s.key)}
                        className="group flex flex-1 flex-col items-center gap-1.5"
                        aria-label={`Go to ${s.label} step`}
                      >
                        <span
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-all',
                            done && 'border-brand bg-brand text-brand-foreground',
                            active && 'border-brand bg-brand/10 text-brand',
                            !done && !active && 'border-border bg-white text-muted-foreground'
                          )}
                        >
                          {done ? <Check className="h-4 w-4" /> : i + 1}
                        </span>
                        <span
                          className={cn(
                            'text-[11px] font-medium transition',
                            active ? 'text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {s.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-brand"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressValue}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
              </div>

              <CardShell>
                {/* ---------- STEP: PROFILE ---------- */}
                {step === 'profile' && (
                  <>
                    <StepHeading
                      icon={User}
                      title="Your Builder Profile"
                      subtitle="Tell the world who you are. This appears on your public Builder page."
                    />
                    <div className="mt-6 space-y-5">
                      <Field label="Builder / Company Name" required error={errors.full_name}>
                        <Input
                          value={form.full_name}
                          onChange={(e) => setField('full_name', e.target.value)}
                          placeholder="e.g. Acme Software"
                          autoFocus
                        />
                      </Field>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Profile Photo URL" icon={ImageIcon}>
                          <Input
                            value={form.avatar_url}
                            onChange={(e) => setField('avatar_url', e.target.value)}
                            placeholder="https://…"
                          />
                          <AvatarPreview url={form.avatar_url} />
                        </Field>
                        <Field label="Cover Image URL" icon={ImageIcon}>
                          <Input
                            value={form.cover_url}
                            onChange={(e) => setField('cover_url', e.target.value)}
                            placeholder="https://…"
                          />
                        </Field>
                      </div>

                      <Field label="Short Bio" hint="A couple of sentences about what you build.">
                        <Textarea
                          value={form.bio}
                          onChange={(e) => setField('bio', e.target.value)}
                          placeholder="I build tools that help teams ship faster…"
                          rows={4}
                        />
                      </Field>

                      <Field label="Country" icon={MapPin} hint="Optional">
                        <Input
                          value={form.country}
                          onChange={(e) => setField('country', e.target.value)}
                          placeholder="e.g. United States"
                        />
                      </Field>
                    </div>
                  </>
                )}

                {/* ---------- STEP: SOCIAL / LINKS ---------- */}
                {step === 'social' && (
                  <>
                    <StepHeading
                      icon={Globe}
                      title="Links & Socials"
                      subtitle="Where can people find your work? All optional — add what you have."
                    />
                    <div className="mt-6 space-y-5">
                      <Field label="Website" icon={Globe}>
                        <Input
                          value={form.website}
                          onChange={(e) => setField('website', e.target.value)}
                          placeholder="https://yourdomain.com"
                        />
                      </Field>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="GitHub" icon={Github}>
                          <Input
                            value={form.github}
                            onChange={(e) => setField('github', e.target.value)}
                            placeholder="username or https://github.com/…"
                          />
                        </Field>
                        <Field label="Twitter / X" icon={Twitter}>
                          <Input
                            value={form.twitter}
                            onChange={(e) => setField('twitter', e.target.value)}
                            placeholder="@username or https://x.com/…"
                          />
                        </Field>
                      </div>

                      <Field label="LinkedIn" icon={Linkedin}>
                        <Input
                          value={form.linkedin}
                          onChange={(e) => setField('linkedin', e.target.value)}
                          placeholder="https://linkedin.com/in/…"
                        />
                      </Field>
                    </div>
                  </>
                )}

                {/* ---------- STEP: CATEGORIES ---------- */}
                {step === 'categories' && (
                  <>
                    <StepHeading
                      icon={Sparkles}
                      title="Primary Categories"
                      subtitle="Pick the areas you build in. This helps people discover your software."
                    />
                    <div className="mt-6">
                      {categoriesLoading ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div
                              key={i}
                              className="h-12 animate-pulse rounded-xl bg-muted/40"
                            />
                          ))}
                        </div>
                      ) : categories.length === 0 ? (
                        <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                          No categories available yet. You can skip this step.
                        </p>
                      ) : (
                        <>
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {form.category_ids.length} selected
                            </p>
                            {form.category_ids.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setField('category_ids', [])}
                                className="text-xs text-muted-foreground transition hover:text-foreground"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2.5">
                            {categories.map((cat) => {
                              const selected = form.category_ids.includes(cat.id);
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => toggleCategory(cat.id)}
                                  className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all',
                                    selected
                                      ? 'border-brand bg-brand text-brand-foreground shadow-sm shadow-brand/20'
                                      : 'border-border bg-white text-foreground hover:border-brand/40 hover:bg-brand/5'
                                  )}
                                >
                                  {selected ? (
                                    <Check className="h-3.5 w-3.5" />
                                  ) : (
                                    <span className="h-3.5 w-3.5 rounded-full border border-current opacity-30" />
                                  )}
                                  {cat.name}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}

                {/* ---------- STEP: REVIEW ---------- */}
                {step === 'review' && (
                  <>
                    <StepHeading
                      icon={CheckCircle2}
                      title="Review & Finish"
                      subtitle="Make sure everything looks good, then complete your onboarding."
                    />
                    <div className="mt-6 space-y-4">
                      <ReviewRow label="Name" value={form.full_name || '—'} />
                      <ReviewRow label="Bio" value={form.bio || '—'} />
                      <ReviewRow label="Website" value={form.website || '—'} />
                      <ReviewRow label="GitHub" value={form.github || '—'} />
                      <ReviewRow label="Twitter / X" value={form.twitter || '—'} />
                      <ReviewRow label="LinkedIn" value={form.linkedin || '—'} />
                      <ReviewRow label="Country" value={form.country || '—'} />
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Primary Categories
                        </p>
                        {form.category_ids.length === 0 ? (
                          <p className="mt-1 text-sm text-muted-foreground">None selected</p>
                        ) : (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {form.category_ids.map((id) => {
                              const cat = categories.find((c) => c.id === id);
                              return cat ? (
                                <span
                                  key={id}
                                  className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand"
                                >
                                  {cat.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Navigation */}
                <div className="mt-8 flex items-center justify-between gap-3">
                  <Button variant="ghost" onClick={back} disabled={submitting}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
                  </Button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSkip}
                      disabled={submitting || skipping}
                      className="text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                    >
                      {skipping ? 'Skipping…' : 'Skip for now'}
                    </button>

                    {step !== 'review' ? (
                      <Button className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={next}>
                        Continue <ArrowRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        className="bg-brand text-brand-foreground hover:bg-brand/90"
                        onClick={handleSubmit}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Finishing…
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Become a Builder
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardShell>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          You can edit any of this later from your dashboard.
        </p>
      </div>
    </div>
  );
}

/* -------------------- Helper components -------------------- */

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-white p-6 shadow-card sm:p-8">
      {children}
    </div>
  );
}

function StepHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof User;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  hint,
  error,
  icon: Icon,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
  error?: string;
  icon?: typeof User;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <Label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-brand">*</span>}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">— {hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FeaturePill({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Package;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/60 bg-white p-4 text-center">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

function AvatarPreview({ url }: { url: string }) {
  const [ok, setOk] = useState(true);
  useEffect(() => {
    setOk(true);
  }, [url]);

  if (!url.trim()) return null;
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="h-9 w-9 overflow-hidden rounded-full border border-border/60 bg-muted/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {ok ? (
          <img
            src={url}
            alt="Avatar preview"
            className="h-full w-full object-cover"
            onError={() => setOk(false)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-4 w-4" />
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground">Preview</span>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/40 pb-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="max-w-[60%] text-right text-sm font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}
