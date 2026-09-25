'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import type { Category, Product, ProductType } from '@/lib/types';
import { PRODUCT_TYPE_LABELS } from '@/lib/types';
import { saveDraft, loadDraft, clearDraft } from '@/lib/form-draft';
import { trackFunnelEvent } from '@/lib/funnel-analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup } from '@/components/ui/radio-group';
import { LogoUploader, GalleryUploader } from '@/components/image-uploader';
import { NeedMatchDialog } from '@/components/forms/need-match-dialog';
import { toast } from 'sonner';
import {
  Loader2, Package, Plus, X as XIcon, ChevronDown, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LISTING_FEE_CENTS = 1000; // $10.00
const PRODUCT_TYPES: ProductType[] = ['saas', 'ai_agent', 'ai_tool', 'automation', 'dev_tool', 'api', 'other'];
const PRICING_OPTIONS = ['Free', 'Freemium', 'Paid', 'Contact for pricing'];

// Deliberately permissive -- accepts a plain domain (adds https:// for
// them) as well as a full URL, and doesn't care what kind of destination
// it is (marketing site, docs page, GitHub repo, app.foo.com, etc.). Only
// rejects things that clearly aren't a URL at all.
function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (!parsed.hostname.includes('.')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

type Draft = {
  name: string; tagline: string; url: string; description: string; problemSolved: string;
  targetAudience: string; keyFeatures: string[]; howItWorks: string; productType: ProductType;
  repoUrl: string; docUrl: string; demoUrl: string; videoUrl: string; founderName: string;
  pricing: string; priceFrom: string; categoryId: string; tagsInput: string;
};

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
  const router = useRouter();
  const pathname = usePathname();
  const isEditing = !!product;
  const draftKey = 'product';

  const [name, setName] = useState(product?.name ?? '');
  const [tagline, setTagline] = useState(product?.tagline ?? '');
  const [url, setUrl] = useState(product?.url ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [problemSolved, setProblemSolved] = useState(product?.problem_solved ?? '');
  const [targetAudience, setTargetAudience] = useState(product?.target_audience ?? '');
  const [keyFeatures, setKeyFeatures] = useState<string[]>(product?.key_features?.length ? product.key_features : ['']);
  const [howItWorks, setHowItWorks] = useState(product?.how_it_works ?? '');
  const [productType, setProductType] = useState<ProductType>(product?.product_type ?? 'saas');
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
  const [moreOpen, setMoreOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alreadyClaimedFree, setAlreadyClaimedFree] = useState(false);
  const [matchDialog, setMatchDialog] = useState<{ open: boolean; productId: string; description: string }>({
    open: false,
    productId: '',
    description: '',
  });
  const startedRef = useRef(false);
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!user || isEditing) return;
    supabase.from('profiles').select('free_product_claimed').eq('id', user.id).maybeSingle()
      .then(({ data }) => setAlreadyClaimedFree((data as any)?.free_product_claimed ?? false));
  }, [user, isEditing]);

  // Restore a pre-auth draft once, on mount -- never in edit mode. Uploaded
  // images can't be carried through this way (they need an authenticated
  // storage destination), so logo/screenshots are the one thing the
  // submitter may need to re-add after signing in -- everything else text
  // is preserved.
  useEffect(() => {
    if (isEditing || restoredRef.current) return;
    restoredRef.current = true;
    const draft = loadDraft<Draft>(draftKey);
    if (!draft) return;
    setName(draft.name); setTagline(draft.tagline); setUrl(draft.url); setDescription(draft.description);
    setProblemSolved(draft.problemSolved); setTargetAudience(draft.targetAudience);
    setKeyFeatures(draft.keyFeatures.length ? draft.keyFeatures : ['']);
    setHowItWorks(draft.howItWorks); setProductType(draft.productType);
    setRepoUrl(draft.repoUrl); setDocUrl(draft.docUrl); setDemoUrl(draft.demoUrl); setVideoUrl(draft.videoUrl);
    setFounderName(draft.founderName); setPricing(draft.pricing); setPriceFrom(draft.priceFrom);
    setCategoryId(draft.categoryId); setTagsInput(draft.tagsInput);
    if (draft.howItWorks || draft.productType !== 'saas' || draft.demoUrl || draft.founderName) setMoreOpen(true);
    clearDraft(draftKey);
    toast.success('Welcome back — your listing is ready to publish.');
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing && name.trim().length > 0 && !startedRef.current) {
      startedRef.current = true;
      trackFunnelEvent('submit_product_started');
    }
  }, [name, isEditing]);

  const isProBuilder = profile?.pro_builder ?? false;
  // Mirrors the server-side check in claim_free_product_listing(): a lifetime
  // flag, not "do I currently have a paid product" (that could be reset by
  // deleting and recreating a listing -- see the migration).
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

  function currentDraft(): Draft {
    return {
      name, tagline, url, description, problemSolved, targetAudience, keyFeatures,
      howItWorks, productType, repoUrl, docUrl, demoUrl, videoUrl, founderName,
      pricing, priceFrom, categoryId, tagsInput,
    };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    trackFunnelEvent('submit_product_submit_clicked');
    if (name.trim().length < 2) { toast.error('Product name is too short'); return; }
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) { toast.error('Add a valid website URL (e.g. yourproduct.com or https://yourproduct.com)'); return; }
    if (tagline.trim().length < 5) { toast.error('Add a short tagline'); return; }

    // Defer auth to this point, not page load -- preserve everything typed
    // so far and pick back up here once signed in (?next= already exists).
    if (!user) {
      trackFunnelEvent('submit_product_auth_required');
      saveDraft(draftKey, currentDraft());
      router.push(`/signin?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setLoading(true);

    const cleanFeatures = keyFeatures.map((f) => f.trim()).filter(Boolean);

    const productData = {
      name: name.trim(),
      tagline: tagline.trim(),
      description: description.trim() || null,
      problem_solved: problemSolved.trim() || null,
      target_audience: targetAudience.trim() || null,
      key_features: cleanFeatures,
      how_it_works: howItWorks.trim() || null,
      product_type: productType,
      url: normalizedUrl,
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
      trackFunnelEvent('submit_product_created', { product_id: productId, free: true });
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
      trackFunnelEvent('submit_product_created', { product_id: productId, free: false });
      window.location.href = checkoutUrl;
    } catch {
      toast.error('Payment could not be started. Your listing was saved as unpaid — you can retry from the dashboard.');
      setLoading(false);
      onDone();
    }
  }

  return (
    <>
    <form onSubmit={submit} className="space-y-5">
      {/* Essentials -- the only things asked for up front */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="p-name">Product name</Label>
          <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme AI" required autoFocus className="text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-url">Website URL</Label>
          {/* type="text", not "url" -- native URL validation rejects a bare
              domain like "acme.ai" for missing a protocol, which is exactly
              what normalizeUrl() below is meant to accept. Real validation
              happens in submit(). */}
          <Input id="p-url" type="text" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="yourproduct.com" required className="text-base" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-tagline">Short tagline</Label>
          <Input id="p-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. AI-powered customer support for small businesses" required className="text-base" />
        </div>
      </div>

      {!isEditing && (
        <div className={cn(
          'flex items-center gap-3 rounded-xl border p-3.5',
          isFreeListing ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-brand/20 bg-brand/5'
        )}>
          <div className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            isFreeListing ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand/10 text-brand'
          )}>
            <Sparkles className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium text-foreground">
            {isFreeListing
              ? (isProBuilder ? 'Unlimited listings with Pro Builder' : 'Your first product listing is free')
              : 'Listing fee: $10 (your first listing was already used)'}
          </p>
        </div>
      )}

      {/* Recommended -- shown, not gated, but never blocks publishing */}
      <div className="space-y-4 rounded-xl border border-border/60 p-4">
        <p className="text-sm font-medium text-foreground">Help people understand your product <span className="font-normal text-muted-foreground">(recommended)</span></p>
        <div className="space-y-2">
          <Label htmlFor="p-desc">What does your product do? <span className="font-normal text-muted-foreground">(Optional)</span></Label>
          <Textarea id="p-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what your product helps people accomplish in 2–4 sentences." rows={3} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-problem">What problem does this solve?</Label>
          <Textarea id="p-problem" value={problemSolved} onChange={(e) => setProblemSolved(e.target.value)} placeholder="Example: Small businesses spend hours manually following up with leads..." rows={2} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-audience">Who is it for?</Label>
          <Input id="p-audience" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="e.g. Freelance designers and small creative agencies" />
        </div>
        <div className="space-y-2">
          <Label>What can people do with it?</Label>
          <div className="space-y-2">
            {keyFeatures.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={f}
                  onChange={(e) => updateFeature(i, e.target.value)}
                  placeholder={i === 0 ? 'Example: Automatically capture leads, send follow-ups, track replies...' : `Feature ${i + 1}`}
                />
                {keyFeatures.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground" onClick={() => removeFeature(i)}>
                    <XIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {keyFeatures.length < 8 && (
              <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add feature
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Optional -- collapsed by default */}
      <details className="group rounded-xl border border-border/60" open={moreOpen} onToggle={(e) => setMoreOpen((e.target as HTMLDetailsElement).open)}>
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm font-medium text-foreground">
          Add more details <span className="font-normal text-muted-foreground">(optional)</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180" />
        </summary>
        <div className="space-y-5 border-t border-border/60 p-4">
          <div className="space-y-2">
            <Label htmlFor="p-how">How it works</Label>
            <Textarea id="p-how" value={howItWorks} onChange={(e) => setHowItWorks(e.target.value)} placeholder="Briefly explain how someone uses it from start to finish." rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Pricing</Label>
            <RadioGroup value={pricing} onValueChange={setPricing} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PRICING_OPTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPricing(p)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-xs font-medium transition',
                    pricing === p ? 'border-brand bg-brand/10 text-brand' : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                  )}
                >
                  {p}
                </button>
              ))}
            </RadioGroup>
            {pricing === 'Paid' && (
              <Input value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)} placeholder="Starts from, e.g. $9/mo" className="mt-2" />
            )}
          </div>

          <div className="space-y-2">
            <Label>Product type</Label>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setProductType(t)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                    productType === t ? 'border-brand bg-brand/10 text-brand' : 'border-border/60 bg-white text-muted-foreground hover:border-border hover:text-foreground'
                  )}
                >
                  {PRODUCT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

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
              <Label htmlFor="p-tags">Tags / keywords</Label>
              <Input id="p-tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="proposals, agencies, ai writing" />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-demo">Demo URL</Label>
              <Input id="p-demo" type="url" value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} placeholder="https://yourproduct.com/demo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-video">Demo video</Label>
              <Input id="p-video" type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-repo">Repository</Label>
              <Input id="p-repo" type="url" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-docs">Documentation</Label>
              <Input id="p-docs" type="url" value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://docs.yourproduct.com" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-founder">Founder / company name</Label>
            <Input id="p-founder" value={founderName} onChange={(e) => setFounderName(e.target.value)} placeholder="e.g. Jane at Postly" />
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Logo</Label>
              {user ? (
                <LogoUploader logoUrl={logoUrl} onLogoChange={setLogoUrl} />
              ) : (
                <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
                  Sign in to upload a logo — you can add one right after.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Screenshots</Label>
              {user ? (
                <GalleryUploader images={images} onImagesChange={setImages} />
              ) : (
                <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground">
                  Sign in to upload screenshots — you can add these right after.
                </p>
              )}
            </div>
          </div>
        </div>
      </details>

      <div>
        <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90 sm:w-auto">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
          {isEditing
            ? (loading ? 'Saving...' : 'Save changes')
            : loading
              ? 'Publishing...'
              : isFreeListing
                ? 'Submit your product — Free'
                : 'Continue to payment — $10'}
        </Button>
      </div>
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
