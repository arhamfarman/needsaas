'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import type { Category, Product, ProductType } from '@/lib/types';
import { PRODUCT_TYPE_LABELS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LogoUploader, GalleryUploader } from '@/components/image-uploader';
import { NeedMatchDialog } from '@/components/forms/need-match-dialog';
import { toast } from 'sonner';
import {
  Loader2, CreditCard, Lock, Info, Package, Link2, Image, FileText, Tag,
  Target, ListChecks, Workflow, Plus, X as XIcon, Video, Github as GithubIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LISTING_FEE_CENTS = 1000; // $10.00

const PRODUCT_TYPES: ProductType[] = ['saas', 'ai_agent', 'ai_tool', 'automation', 'dev_tool', 'api', 'other'];

export function ProductForm({
  categories,
  onDone,
  product,
}: {
  categories: Category[];
  onDone: (createdProductId?: string) => void;
  /** When provided, the form edits this existing product instead of creating a new one. */
  product?: Product;
}) {
  const { user, profile } = useAuth();
  const isEditing = !!product;

  const [name, setName] = useState(product?.name ?? '');
  const [tagline, setTagline] = useState(product?.tagline ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [problemSolved, setProblemSolved] = useState(product?.problem_solved ?? '');
  const [targetAudience, setTargetAudience] = useState(product?.target_audience ?? '');
  const [keyFeatures, setKeyFeatures] = useState<string[]>(product?.key_features?.length ? product.key_features : ['']);
  const [howItWorks, setHowItWorks] = useState(product?.how_it_works ?? '');
  const [productType, setProductType] = useState<ProductType>(product?.product_type ?? 'saas');
  const [url, setUrl] = useState(product?.url ?? '');
  const [repoUrl, setRepoUrl] = useState(product?.repo_url ?? '');
  const [docUrl, setDocUrl] = useState(product?.doc_url ?? '');
  const [demoUrl, setDemoUrl] = useState(product?.demo_url ?? '');
  const [videoUrl, setVideoUrl] = useState(product?.video_url ?? '');
  const [founderName, setFounderName] = useState(product?.founder_name ?? '');
  const [pricing, setPricing] = useState(product?.pricing ?? 'Free');
  const [priceFrom, setPriceFrom] = useState(product?.price_from ?? '');
  const [categoryId, setCategoryId] = useState(product?.category_id ?? 'none');
  const [tagsInput, setTagsInput] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(product?.logo_url ?? null);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [loading, setLoading] = useState(false);
  const [publishedCount, setPublishedCount] = useState(0);
  const [alreadyClaimedFree, setAlreadyClaimedFree] = useState(false);
  const [matchDialog, setMatchDialog] = useState<{ open: boolean; productId: string; description: string }>({
    open: false,
    productId: '',
    description: '',
  });

  useEffect(() => {
    if (!user || isEditing) return;
    Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('owner_id', user.id).eq('paid', true),
      supabase.from('profiles').select('free_product_claimed').eq('id', user.id).maybeSingle(),
    ]).then(([countRes, profileRes]) => {
      setPublishedCount(countRes.count ?? 0);
      setAlreadyClaimedFree((profileRes.data as any)?.free_product_claimed ?? false);
    });
  }, [user, isEditing]);

  const isProBuilder = profile?.pro_builder ?? false;
  // Mirrors the server-side check in claim_free_product_listing(): a lifetime
  // flag, not "do I currently have a paid product" (that version could be
  // reset by deleting and recreating a listing -- see the migration).
  const isFreeListing = isProBuilder || !alreadyClaimedFree;

  function updateFeature(i: number, value: string) {
    setKeyFeatures((prev) => prev.map((f, idx) => (idx === i ? value : f)));
  }
  function addFeature() {
    if (keyFeatures.length >= 8) return;
    setKeyFeatures((prev) => [...prev, '']);
  }
  function removeFeature(i: number) {
    setKeyFeatures((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (name.trim().length < 2) { toast.error('Product name is too short'); return; }
    if (tagline.trim().length < 5) { toast.error('Add a short tagline'); return; }
    if (description.trim().length < 40) { toast.error('Describe what your product does, who it\'s for, and why in at least 40 characters'); return; }
    if (problemSolved.trim().length < 15) { toast.error('Describe the specific problem this solves'); return; }
    if (targetAudience.trim().length < 10) { toast.error('Describe who this is for'); return; }
    const cleanFeatures = keyFeatures.map((f) => f.trim()).filter(Boolean);
    if (cleanFeatures.length < 1) { toast.error('List at least one key feature'); return; }

    setLoading(true);

    const productData = {
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      problem_solved: problemSolved.trim(),
      target_audience: targetAudience.trim(),
      key_features: cleanFeatures,
      how_it_works: howItWorks.trim() || null,
      product_type: productType,
      url: url.trim() || null,
      repo_url: repoUrl.trim() || null,
      doc_url: docUrl.trim() || null,
      demo_url: demoUrl.trim() || null,
      video_url: videoUrl.trim() || null,
      founder_name: founderName.trim() || null,
      pricing: pricing.trim() || null,
      price_from: pricing === 'Paid' ? priceFrom.trim() || null : null,
      category_id: categoryId === 'none' ? null : categoryId,
      logo_url: logoUrl,
      images,
    };

    if (isEditing) {
      const { error } = await supabase.from('products').update(productData).eq('id', product.id);
      setLoading(false);
      if (error) { toast.error('Could not save changes: ' + error.message); return; }
      toast.success('Product updated');
      onDone();
      return;
    }

    // Every new listing is created unpaid (the DB no longer accepts paid/paid_at
    // on insert — see restrict_product_insert_columns.sql). Free eligibility is
    // re-derived and applied server-side via claim_free_product_listing().
    const { data, error } = await supabase.from('products').insert(productData).select('id').single();

    if (error) {
      setLoading(false);
      if (error.code === '23505') {
        toast.error("You already have a product with this name. Give this one a different name, or edit the existing listing.");
      } else {
        toast.error('Could not create the product listing. Please try again.');
      }
      return;
    }

    const productId = data.id;

    // Tags are optional and best-effort — a failure here shouldn't block
    // publishing the listing itself.
    const tagNames = tagsInput.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 8);
    if (tagNames.length > 0) {
      await linkTags(productId, tagNames);
    }

    const { data: claimed, error: claimError } = await supabase.rpc('claim_free_product_listing', {
      product_id: productId,
    });

    if (!claimError && claimed) {
      toast.success(isProBuilder ? 'Your software is published!' : 'Your first software listing is published — free!');
      setLoading(false);
      setMatchDialog({ open: true, productId, description: description.trim() });
      onDone(productId);
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
      <FormSection icon={Package} title="What are you listing?" description="NeedSaaS isn't just for SaaS — list any kind of software product.">
        <div className="flex flex-wrap gap-2">
          {PRODUCT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setProductType(t)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                productType === t
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border/60 bg-white text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              {PRODUCT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection icon={FileText} title="Basic Information" description="Tell people what your software is and who it's for.">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">Product name</Label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Postly" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-tagline">Short tagline</Label>
            <Input id="p-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. AI-powered proposal generator for small agencies" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-desc">Describe your product</Label>
            <p className="text-xs text-muted-foreground">
              Tell people what it does, who it&apos;s for, and why they should care. Avoid vague phrases like
              &ldquo;revolutionary platform&rdquo; — explain the actual problem and solution, as if to someone who&apos;s never heard of it.
            </p>
            <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does it do? Who is it for? What makes it different?" rows={5} required />
          </div>
        </div>
      </FormSection>

      <FormSection icon={Target} title="Problem &amp; Audience" description="This is what makes your page useful to search engines, AI search, and people skimming it.">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-problem">What problem does your product solve?</Label>
            <p className="text-xs text-muted-foreground">e.g. &ldquo;Small agencies spend hours creating proposals manually. Our tool generates branded proposals from a short project brief.&rdquo;</p>
            <Textarea id="p-problem" value={problemSolved} onChange={(e) => setProblemSolved(e.target.value)} placeholder="What specific problem does this solve?" rows={3} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-audience">Who is this for?</Label>
            <p className="text-xs text-muted-foreground">e.g. &ldquo;Freelance designers and small creative agencies that regularly send client proposals.&rdquo;</p>
            <Textarea id="p-audience" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Describe the ideal user or customer — business type, role, or person." rows={2} required />
          </div>
        </div>
      </FormSection>

      <FormSection icon={ListChecks} title="Key Features" description="List the most important things users can do with your product.">
        <div className="space-y-2">
          {keyFeatures.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={f}
                onChange={(e) => updateFeature(i, e.target.value)}
                placeholder={`Feature ${i + 1}`}
              />
              {keyFeatures.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground" onClick={() => removeFeature(i)}>
                  <XIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {keyFeatures.length < 8 && (
            <Button type="button" variant="outline" size="sm" onClick={addFeature} className="mt-1">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add feature
            </Button>
          )}
        </div>
      </FormSection>

      <FormSection icon={Workflow} title="How It Works" description="Briefly explain how someone uses the product from start to finish.">
        <Textarea value={howItWorks} onChange={(e) => setHowItWorks(e.target.value)} placeholder="e.g. Paste in a project brief, pick a template, and get a branded proposal in under a minute." rows={3} />
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

      <FormSection icon={Link2} title="Links" description="Where can people find, try, and read more about your product?">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-url">Website URL</Label>
            <Input id="p-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourproduct.com" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-demo">Demo URL (optional)</Label>
              <Input id="p-demo" type="url" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://yourproduct.com/demo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-video"><Video className="mr-1 inline h-3.5 w-3.5" />Demo video (optional)</Label>
              <Input id="p-video" type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-repo"><GithubIcon className="mr-1 inline h-3.5 w-3.5" />Repository (optional)</Label>
              <Input id="p-repo" type="url" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-docs">Documentation (optional)</Label>
              <Input id="p-docs" type="url" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://docs.yourproduct.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-founder">Founder / company name (optional)</Label>
            <Input id="p-founder" value={founderName} onChange={(e) => setFounderName(e.target.value)} placeholder="e.g. Jane at Postly" />
          </div>
        </div>
      </FormSection>

      <FormSection icon={CreditCard} title="Pricing" description="How is your product priced?">
        <div className="space-y-4">
          <RadioGroup value={pricing} onValueChange={setPricing} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {['Free', 'Freemium', 'Paid', 'Contact for pricing'].map((p) => (
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

      <FormSection icon={Tag} title="Categories &amp; Tags" description="Help people and search engines discover your product.">
        <div className="space-y-4">
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
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="p-tags">Tags / keywords (optional)</Label>
              <Input id="p-tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="proposals, agencies, ai writing" />
              <p className="text-xs text-muted-foreground">Comma-separated. Helps people find your product when browsing or searching.</p>
            </div>
          )}
        </div>
      </FormSection>

      {!isEditing && (
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
      )}

      <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
        {isEditing
          ? (loading ? 'Saving...' : 'Save changes')
          : loading
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

async function linkTags(productId: string, tagNames: string[]) {
  for (const rawName of tagNames) {
    const name = rawName.slice(0, 40);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!slug) continue;

    let tagId: string | null = null;
    const { data: existing } = await supabase.from('tags').select('id').eq('slug', slug).maybeSingle();
    if (existing) {
      tagId = existing.id;
    } else {
      const { data: created } = await supabase.from('tags').insert({ name, slug }).select('id').maybeSingle();
      tagId = created?.id ?? null;
    }
    if (tagId) {
      await supabase.from('product_tags').insert({ product_id: productId, tag_id: tagId });
    }
  }
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
