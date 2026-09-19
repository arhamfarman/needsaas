'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/logo';

// Reached from the "reset your password" email link. lib/supabase.ts has
// `detectSessionInUrl: true`, so the Supabase client parses the recovery
// token in the URL and establishes a session automatically -- this page just
// waits for that (via onAuthStateChange's PASSWORD_RECOVERY event, or an
// already-present session on mount) before letting the user set a new
// password with supabase.auth.updateUser(). If the link itself was invalid
// or expired, Supabase redirects here with ?error_description= instead of a
// usable token -- surfaced directly rather than leaving the user stuck on a
// silent "waiting" state forever.
function ResetPasswordConfirmForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const linkError = searchParams.get('error_description') || searchParams.get('error');

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.push('/dashboard'), 2000);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0 -z-10 mesh-gradient" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-brand/5 blur-[140px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <Logo size={32} />
        </Link>

        <div className="rounded-2xl border border-border/50 bg-card/80 p-6 shadow-soft-xl backdrop-blur-xl sm:p-8">
          {done ? (
            <div className="flex items-start gap-3 rounded-lg border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div>
                <p className="font-medium">Password updated</p>
                <p className="mt-1 text-muted-foreground">Taking you to your dashboard...</p>
              </div>
            </div>
          ) : linkError ? (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-foreground">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="font-medium">This link is no longer valid</p>
                <p className="mt-1 text-muted-foreground">
                  {linkError.replace(/\+/g, ' ')} —{' '}
                  <Link href="/reset-password" className="underline hover:text-foreground">request a new link</Link>.
                </p>
              </div>
            </div>
          ) : !ready ? (
            <>
              <h1 className="font-display text-xl font-semibold text-foreground">Reset your password</h1>
              <p className="mb-5 mt-1.5 text-sm text-muted-foreground">
                Open this page using the reset link from your email. If you followed that link and are still seeing
                this, the link may have expired --{' '}
                <Link href="/reset-password" className="underline hover:text-foreground">request a new one</Link>.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-xl font-semibold text-foreground">Choose a new password</h1>
              <p className="mb-5 mt-1.5 text-sm text-muted-foreground">Enter a new password for your account.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
                  {loading ? 'Updating...' : 'Update password'}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ResetPasswordConfirmForm />
    </Suspense>
  );
}
