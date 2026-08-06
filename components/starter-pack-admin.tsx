'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import type { StarterPack, StarterPackFaq, Product, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Plus, Trash2, Edit, Star, GripVertical, Eye, EyeOff, Save,
  Package, HelpCircle, X, ArrowUp, ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function StarterPackAdmin() {
  const { user, profile } = useAuth();
  const [packs, setPacks] = useState<StarterPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPack, setEditingPack] = useState<StarterPack | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('starter_packs')
      .select('*')
      .order('created_at', { ascending: false });
    setPacks((data as StarterPack[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!profile?.is_admin) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center">
        <p className="text-sm text-muted-foreground">You need admin access to manage starter packs.</p>
      </div>
    );
  }

  async function togglePublish(pack: StarterPack) {
    const { error } = await supabase
      .from('starter_packs')
      .update({ published: !pack.published })
      .eq('id', pack.id);
    if (error) { toast.error('Failed to update'); return; }
    toast.success(pack.published ? 'Unpublished' : 'Published');
    load();
  }

  async function deletePack(pack: StarterPack) {
    const { error } = await supabase.from('starter_packs').delete().eq('id', pack.id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Deleted');
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Starter Packs</h2>
          <p className="text-sm text-muted-foreground">Create and manage curated software collections.</p>
        </div>
        <Button onClick={() => { setEditingPack(null); setShowEditor(true); }} className="bg-brand text-brand-foreground hover:bg-brand/90">
          <Plus className="mr-1.5 h-4 w-4" /> New Pack
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : packs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          No starter packs yet. Create your first one.
        </div>
      ) : (
        <div className="space-y-3">
          {packs.map((pack) => (
            <div key={pack.id} className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">{pack.title}</h3>
                  {pack.published ? (
                    <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50">Published</Badge>
                  ) : (
                    <Badge variant="outline">Draft</Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {pack.short_description || pack.industry || `/${pack.slug}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => togglePublish(pack)} title={pack.published ? 'Unpublish' : 'Publish'}>
                  {pack.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditingPack(pack); setShowEditor(true); }} title="Edit">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deletePack(pack)} title="Delete" className="text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditor && (
        <PackEditor
          pack={editingPack}
          onClose={() => { setShowEditor(false); setEditingPack(null); }}
          onSaved={() => { setShowEditor(false); setEditingPack(null); load(); }}
        />
      )}
    </div>
  );
}

function PackEditor({ pack, onClose, onSaved }: { pack: StarterPack | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(pack?.title ?? '');
  const [slug, setSlug] = useState(pack?.slug ?? '');
  const [description, setDescription] = useState(pack?.description ?? '');
  const [shortDescription, setShortDescription] = useState(pack?.short_description ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(pack?.cover_image_url ?? '');
  const [industry, setIndustry] = useState(pack?.industry ?? '');
  const [published, setPublished] = useState(pack?.published ?? false);
  const [seoTitle, setSeoTitle] = useState(pack?.seo_title ?? '');
  const [seoDescription, setSeoDescription] = useState(pack?.seo_description ?? '');
  const [saving, setSaving] = useState(false);

  // Products
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [packProducts, setPackProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  // FAQs
  const [faqs, setFaqs] = useState<StarterPackFaq[]>([]);
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // Categories
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [packCategoryIds, setPackCategoryIds] = useState<string[]>([]);

  useEffect(() => {
    supabase.from('products').select('id, name, tagline, logo_url, pricing, paid').eq('paid', true).order('name')
      .then(({ data }) => setAllProducts((data as Product[]) ?? []));
    supabase.from('categories').select('*').order('name')
      .then(({ data }) => setAllCategories((data as Category[]) ?? []));
  }, []);

  useEffect(() => {
    if (!pack) return;
    supabase.from('starter_pack_products').select(`id, product_id, sort_order, featured, blurb, product:products(id, name, tagline)`)
      .eq('starter_pack_id', pack.id).order('sort_order')
      .then(({ data }) => setPackProducts(data ?? []));
    supabase.from('starter_pack_faqs').select('*').eq('starter_pack_id', pack.id).order('sort_order')
      .then(({ data }) => setFaqs((data as StarterPackFaq[]) ?? []));
    supabase.from('starter_pack_categories').select('category_id').eq('starter_pack_id', pack.id)
      .then(({ data }) => setPackCategoryIds((data ?? []).map((d: any) => d.category_id)));
  }, [pack]);

  function autoSlug(val: string) {
    if (!pack || slug === pack.slug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  }

  async function save() {
    if (!title.trim()) { toast.error('Title is required'); return; }
    if (!slug.trim()) { toast.error('Slug is required'); return; }
    setSaving(true);

    const payload = {
      title: title.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ''),
      description: description.trim() || null,
      short_description: shortDescription.trim() || null,
      cover_image_url: coverImageUrl.trim() || null,
      industry: industry.trim() || null,
      published,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
    };

    let packId = pack?.id;

    if (pack) {
      const { error } = await supabase.from('starter_packs').update(payload).eq('id', pack.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from('starter_packs').insert(payload).select('id').single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      packId = data.id;
    }

    // Save categories
    await supabase.from('starter_pack_categories').delete().eq('starter_pack_id', packId);
    if (packCategoryIds.length > 0) {
      await supabase.from('starter_pack_categories').insert(
        packCategoryIds.map((cid) => ({ starter_pack_id: packId, category_id: cid }))
      );
    }

    // Save FAQs
    await supabase.from('starter_pack_faqs').delete().eq('starter_pack_id', packId);
    if (faqs.length > 0) {
      await supabase.from('starter_pack_faqs').insert(
        faqs.map((f, i) => ({ starter_pack_id: packId, question: f.question, answer: f.answer, sort_order: i }))
      );
    }

    toast.success('Saved');
    setSaving(false);
    onSaved();
  }

  async function addProduct() {
    if (!selectedProductId || !pack) return;
    const { error } = await supabase.from('starter_pack_products').insert({
      starter_pack_id: pack.id,
      product_id: selectedProductId,
      sort_order: packProducts.length,
    });
    if (error) { toast.error(error.message); return; }
    setSelectedProductId('');
    const { data } = await supabase.from('starter_pack_products')
      .select(`id, product_id, sort_order, featured, blurb, product:products(id, name, tagline)`)
      .eq('starter_pack_id', pack.id).order('sort_order');
    setPackProducts(data ?? []);
  }

  async function removeProduct(ppId: string) {
    if (!pack) return;
    await supabase.from('starter_pack_products').delete().eq('id', ppId);
    const { data } = await supabase.from('starter_pack_products')
      .select(`id, product_id, sort_order, featured, blurb, product:products(id, name, tagline)`)
      .eq('starter_pack_id', pack.id).order('sort_order');
    setPackProducts(data ?? []);
  }

  async function toggleFeatured(pp: any) {
    if (!pack) return;
    await supabase.from('starter_pack_products').update({ featured: !pp.featured }).eq('id', pp.id);
    setPackProducts((prev) => prev.map((p) => p.id === pp.id ? { ...p, featured: !p.featured } : p));
  }

  async function reorderProduct(pp: any, direction: 'up' | 'down') {
    if (!pack) return;
    const sorted = [...packProducts].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((p) => p.id === pp.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    await Promise.all([
      supabase.from('starter_pack_products').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('starter_pack_products').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    const { data } = await supabase.from('starter_pack_products')
      .select(`id, product_id, sort_order, featured, blurb, product:products(id, name, tagline)`)
      .eq('starter_pack_id', pack.id).order('sort_order');
    setPackProducts(data ?? []);
  }

  function addFaq() {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    setFaqs((prev) => [...prev, {
      id: `temp-${Date.now()}`,
      starter_pack_id: pack?.id ?? '',
      question: newFaqQ.trim(),
      answer: newFaqA.trim(),
      sort_order: faqs.length,
    }]);
    setNewFaqQ('');
    setNewFaqA('');
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pack ? 'Edit Starter Pack' : 'New Starter Pack'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basic info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => { setTitle(e.target.value); autoSlug(e.target.value); }} placeholder="Construction Starter Pack" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="construction" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Short Description</Label>
            <Input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="One-line summary for cards" />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Full description shown on the pack page" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Construction" />
            </div>
            <div className="space-y-2">
              <Label>Cover Image URL</Label>
              <Input value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>SEO Title (optional)</Label>
              <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Custom title for search engines" />
            </div>
            <div className="space-y-2">
              <Label>SEO Description (optional)</Label>
              <Input value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="Custom meta description" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={published} onCheckedChange={setPublished} />
            <Label>Published</Label>
          </div>

          {/* Products */}
          {pack && (
            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <h3 className="font-medium text-foreground">Software in this pack</h3>
              <div className="flex gap-2">
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select software to add" /></SelectTrigger>
                  <SelectContent>
                    {allProducts.filter((p) => !packProducts.some((pp) => pp.product_id === p.id)).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={addProduct} disabled={!selectedProductId} size="sm"><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2">
                {packProducts.map((pp, i) => (
                  <div key={pp.id} className="flex items-center gap-2 rounded-lg border border-border/40 p-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground/30" />
                    <span className="flex-1 text-sm text-foreground">{pp.product?.name || 'Unknown'}</span>
                    <button onClick={() => toggleFeatured(pp)} className={cn('rounded p-1', pp.featured ? 'text-amber-500' : 'text-muted-foreground/40 hover:text-amber-500')}>
                      <Star className={cn('h-4 w-4', pp.featured && 'fill-current')} />
                    </button>
                    <button onClick={() => reorderProduct(pp, 'up')} disabled={i === 0} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => reorderProduct(pp, 'down')} disabled={i === packProducts.length - 1} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button onClick={() => removeProduct(pp.id)} className="rounded p-1 text-red-500 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {packProducts.length === 0 && <p className="text-xs text-muted-foreground">No software added yet.</p>}
              </div>
            </div>
          )}

          {/* Categories */}
          {pack && allCategories.length > 0 && (
            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <h3 className="font-medium text-foreground">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {allCategories.map((cat) => {
                  const selected = packCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setPackCategoryIds((prev) => selected ? prev.filter((id) => id !== cat.id) : [...prev, cat.id])}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                        selected ? 'border-brand bg-brand/10 text-brand' : 'border-border/60 text-muted-foreground hover:border-border'
                      )}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* FAQs */}
          {pack && (
            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <h3 className="flex items-center gap-1.5 font-medium text-foreground"><HelpCircle className="h-4 w-4" /> FAQs</h3>
              <div className="space-y-2">
                {faqs.map((faq, i) => (
                  <div key={faq.id} className="rounded-lg border border-border/40 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{faq.question}</p>
                      <button onClick={() => setFaqs((prev) => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Input value={newFaqQ} onChange={(e) => setNewFaqQ(e.target.value)} placeholder="Question" />
                <Textarea value={newFaqA} onChange={(e) => setNewFaqA(e.target.value)} rows={2} placeholder="Answer" />
                <Button onClick={addFaq} size="sm" variant="outline"><Plus className="mr-1 h-3.5 w-3.5" /> Add FAQ</Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={save} disabled={saving} className="bg-brand text-brand-foreground hover:bg-brand/90">
            <Save className="mr-1.5 h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
