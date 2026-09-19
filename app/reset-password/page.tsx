'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/logo';

// There was previously no self-service way to recover an email/password
// account -- no "Forgot password?" link, no page calling
// supabase.auth.resetPasswordForEmail, and no page to set a new password
// from the recovery link. Found during the soft-launch security audit.
// This page + app/reset-password/confirm/page.tsx close that gap, mirroring
// the existing "check your email" pattern from the signup flow in
// app/signin/page.tsx.
export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/confirm`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
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
          {sent ? (
            <div className="flex items-start gap-3 rounded-lg border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-foreground">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <div>
                <p className="font-medium">Check your email</p>
                <p className="mt-1 text-muted-foreground">
                  If an account exists for <span className="font-medium text-foreground">{email}</span>, we sent a
                  link to reset your password. Click it to choose a new one.
                </p>
              </div>
            </div>
          ) : (
            <>
              <h1 className="font-display text-xl font-semibold text-foreground">Reset your password</h1>
              <p className="mb-5 mt-1.5 text-sm text-muted-foreground">
                Enter the email on your account and we&apos;ll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
                  {loading ? 'Sending...' : 'Send reset link'}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm">
            <Link href="/signin" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
