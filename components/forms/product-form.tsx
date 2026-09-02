'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LogoUploader, GalleryUploader } from '@/components/image-uploader';
import { NeedMatchDialog } from '@/components/forms/need-match-dialog';
import { toast } from 'sonner';
import { Loader2, CreditCard, Lock, Info, Package, Link2, Image, FileText, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

const LISTING_FEE_CENTS = 1000; // $10.00

export function ProductForm({ categories, onDone }: { categories: Category[]; onDone: () => void }) {
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [pricing, setPricing] = useState('Free');
  const [priceFrom, setPriceFrom] = useState('');
  const [categoryId, setCategoryId] = useState('none');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishedCount, setPublishedCount] = useState(0);
  const [matchDialog, setMatchDialog] = useState<{ open: boolean; productId: string; description: string }>({
    open: false,
    productId: '',
    description: '',
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .eq('paid', true)
      .then(({ count }) => setPublishedCount(count ?? 0));
  }, [user]);

  const isProBuilder = profile?.pro_builder ?? false;
  const isFirstListing = publishedCount === 0;
  const isFreeListing = isFirstListing || isProBuilder;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (name.trim().length < 2) { toast.error('Product name is too short'); return; }
    if (tagline.trim().length < 5) { toast.error('Add a short tagline'); return; }
    if (description.trim().length < 20) { toast.error('Describe your product in at least 20 characters'); return; }
    setLoading(true);

    const productData = {
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      url: url.trim() || null,
      repo_url: repoUrl.trim() || null,
      doc_url: docUrl.trim() || null,
      pricing: pricing.trim() || null,
      price_from: pricing === 'Paid' ? priceFrom.trim() || null : null,
      category_id: categoryId === 'none' ? null : categoryId,
      logo_url: logoUrl,
      images,
    };

    // Every new listing is created unpaid (the DB no longer accepts paid/paid_at
    // on insert — see restrict_product_insert_columns.sql). Free eligibility is
    // re-derived and applied server-side via claim_free_product_listing().
    const { data, error } = await supabase.from('products').insert(productData).select('id').single();

    if (error) {
      setLoading(false);
      toast.error('Could not create the product listing. Please try again.');
      return;
    }

    const productId = data.id;

    const { data: claimed, error: claimError } = await supabase.rpc('claim_free_product_listing', {
      product_id: productId,
    });

    if (!claimError && claimed) {
      toast.success(isProBuilder ? 'Your software is published!' : 'Your first software listing is published — free!');
      setLoading(false);
      setMatchDialog({ open: true, productId, description: description.trim() });
      onDone();
      return;
    }

    try {
      const origin = window.location.origin;
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          mode: 'payment',
          amount: LISTING_FEE_CENTS,
          product_name: 'NeedSaaS Product Listing',
          product_metadata: { product_id: productId },
          success_url: `${origin}/products/${productId}?paid=1`,
          cancel_url: `${origin}/dashboard?tab=products&cancel=1`,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error ?? 'Checkout request failed');
      }

      const { url: checkoutUrl } = await res.json();
      if (!checkoutUrl) throw new Error('No checkout URL returned');
      window.location.href = checkoutUrl;
    } catch {
      toast.error('Payment could not be started. Your listing was saved as unpaid — you can retry from the dashboard.');
      setLoading(false);
      onDone();
    }
  }

  return (
    <>
    <form onSubmit={submit} className="space-y-6">
      <FormSection icon={FileText} title="Basic Information" description="Tell people what your software is and who it's for.">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">Software name</Label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Postly" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-tagline">Tagline</Label>
            <Input id="p-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One-line summary of what it does" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does it do? Who is it for? What makes it different?" rows={5} required />
          </div>
        </div>
      </FormSection>

      <FormSection icon={Image} title="Branding" description="Upload your logo and product screenshots.">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Logo</Label>
            <LogoUploader logoUrl={logoUrl} onLogoChange={setLogoUrl} />
          </div>
          <div className="space-y-2">
            <Label>Screenshots</Label>
            <GalleryUploader images={images} onImagesChange={setImages} />
          </div>
        </div>
      </FormSection>

      <FormSection icon={Link2} title="Links" description="Where can people find and use your product?">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-url">Website URL</Label>
            <Input id="p-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourproduct.com" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-repo">Repository (optional)</Label>
              <Input id="p-repo" type="url" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-docs">Documentation (optional)</Label>
              <Input id="p-docs" type="url" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://docs.yourproduct.com" />
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection icon={CreditCard} title="Pricing" description="How is your product priced?">
        <div className="space-y-4">
          <RadioGroup value={pricing} onValueChange={setPricing} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {['Free', 'Freemium', 'Paid', 'Open Source'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPricing(p)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition',
                  pricing === p
                    ? 'border-brand/40 bg-brand/5 text-brand'
                    : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                )}
              >
                <div className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full border-2 transition',
                  pricing === p ? 'border-brand' : 'border-muted-foreground/30'
                )}>
                  {pricing === p && <div className="h-2 w-2 rounded-full bg-brand" />}
                </div>
                {p}
              </button>
            ))}
          </RadioGroup>

          {pricing === 'Paid' && (
            <div className="space-y-2">
              <Label htmlFor="p-price-from">Price starts from (optional)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <Input
                  id="p-price-from"
                  value={priceFrom}
                  onChange={(e) => setPriceFrom(e.target.value)}
                  placeholder="9/mo, 49 lifetime, 0.01 per API call..."
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">Let visitors know your entry price. Leave blank if you prefer not to show it.</p>
            </div>
          )}
        </div>
      </FormSection>

      <FormSection icon={Tag} title="Categories" description="Help people discover your product.">
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
      </FormSection>

      <div className={cn(
        'flex items-start gap-3 rounded-xl border p-4',
        isFreeListing ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-brand/20 bg-brand/5'
      )}>
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          isFreeListing ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand/10 text-brand'
        )}>
          {isFreeListing ? <Package className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
        </div>
        <div className="flex-1">
          {isFreeListing ? (
            <>
              <p className="text-sm font-medium text-foreground">{isProBuilder ? 'Unlimited listings with Pro Builder' : 'Your first listing is free'}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isProBuilder ? 'Pro Builders can list unlimited software at no additional cost.' : 'Every new builder gets their first software listing for free. After that, each additional listing costs $10.'}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">Listing fee: $10.00</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                A one-time fee of $10 per additional listing. This covers hosting, review moderation, and keeps spam out.
              </p>
            </>
          )}
        </div>
        {!isFreeListing && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Secure
          </div>
        )}
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
        {loading
          ? 'Redirecting to checkout...'
          : isFreeListing
            ? 'Publish — Free'
            : 'Continue to payment — $10'}
      </Button>
    </form>

    <NeedMatchDialog
      productId={matchDialog.productId}
      description={matchDialog.description}
      open={matchDialog.open}
      onOpenChange={(v) => setMatchDialog((prev) => ({ ...prev, open: v }))}
    />
    </>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/30 p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
