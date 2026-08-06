'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowRight, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/logo';

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signIn, signUp } = useAuth();
  const initialTab = params.get('tab') === 'signup' ? 'signup' : 'signin';
  const [tab, setTab] = useState(initialTab);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setTab(params.get('tab') === 'signup' ? 'signup' : 'signin'); }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (tab === 'signin') {
      const { error } = await signIn(email, password);
      if (error) { setError(error); setLoading(false); return; }
      router.push('/dashboard');
    } else {
      if (username.trim().length < 3) { setError('Username must be at least 3 characters'); setLoading(false); return; }
      const { error } = await signUp(email, password, username.trim());
      if (error) { setError(error); setLoading(false); return; }
      router.push('/dashboard');
    }
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
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <p className="mb-5 text-sm text-muted-foreground">Welcome back. Sign in to your account.</p>
              <AuthForm
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                username={username} setUsername={setUsername}
                showUsername={false}
                error={error} loading={loading}
                onSubmit={handleSubmit}
                submitLabel="Sign in"
              />
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <p className="mb-5 text-sm text-muted-foreground">Create an account to post needs, vote, bookmark software, and contribute to build rewards.</p>
              <AuthForm
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                username={username} setUsername={setUsername}
                showUsername
                error={error} loading={loading}
                onSubmit={handleSubmit}
                submitLabel="Create account"
              />
            </TabsContent>
          </Tabs>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to NeedSaaS&apos;s terms and privacy policy.
        </p>
      </motion.div>
    </div>
  );
}

function AuthForm({
  email, setEmail, password, setPassword, username, setUsername,
  showUsername, error, loading, onSubmit, submitLabel,
}: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  username: string; setUsername: (v: string) => void;
  showUsername: boolean;
  error: string | null; loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {showUsername && (
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="yourname" className="pl-9" required />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-9" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9" required minLength={6} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
        {loading ? 'Please wait...' : submitLabel}
        {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
    </form>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SignInForm />
    </Suspense>
  );
}
