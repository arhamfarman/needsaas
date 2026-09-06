'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import type {
  StarterPack, StarterPackFaq, Product, Category, BlogPost, Need,
} from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { toast } from 'sonner';
import {
  Plus, Trash2, Edit, Star, GripVertical, Eye, EyeOff, Save,
  Package, HelpCircle, X, ArrowUp, ArrowDown, Search, FileText,
  Lightbulb, AlertCircle, ChevronsUpDown, Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Exact-datetime display for the read-only published_at field -- lib/format.ts
// only exports a relative-time formatter (formatDate, "2d ago"), which isn't
// right for an admin fact-check field. Every other admin page that shows an
// absolute date/time (e.g. app/admin/blog/page.tsx) defines this locally too.
function formatDateTime(iso: string | null): string {
  if (!iso) return 'Not yet published';
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : 'Unexpected error';
}

// ---------------------------------------------------------------------------
// Generic searchable picker (Blog Posts / Needs). Built from the shadcn
// Command + Popover primitives already vendored in this project but never
// wired up anywhere -- no new dependency. Filtering is client-side over an
// already-fetched candidate list, matching how small/medium admin pickers
// work elsewhere in this app (no new debounced-search wiring needed).
// ---------------------------------------------------------------------------

type SearchOption = { id: string; label: string; sublabel?: string };

function SearchSelectPopover({
  options,
  onSelect,
  placeholder,
  emptyText,
  disabled,
}: {
  options: SearchOption[];
  onSelect: (id: string) => void;
  placeholder: string;
  emptyText: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal text-muted-foreground"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" /> {placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={opt.label}
                  onSelect={() => {
                    onSelect(opt.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="truncate text-xs text-muted-foreground">{opt.sublabel}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function StarterPackAdmin() {
  const { profile } = useAuth();
  const [packs, setPacks] = useState<StarterPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editingPack, setEditingPack] = useState<StarterPack | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StarterPack | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from('starter_packs')
        .select('*')
        .order('sort_order')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPacks((data as StarterPack[]) ?? []);
    } catch (err) {
      setLoadError('Could not load Starter Packs. Please try again.');
      toast.error('Failed to load Starter Packs', { description: errMsg(err) });
      setPacks([]);
    } finally {
      setLoading(false);
    }
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
    try {
      const { error } = await supabase
        .from('starter_packs')
        .update({ published: !pack.published })
        .eq('id', pack.id);
      if (error) throw error;
      toast.success(pack.published ? 'Unpublished' : 'Published');
      load();
    } catch (err) {
      toast.error('Failed to update', { description: errMsg(err) });
    }
  }

  async function toggleFeaturedPack(pack: StarterPack) {
    try {
      const { error } = await supabase
        .from('starter_packs')
        .update({ featured: !pack.featured })
        .eq('id', pack.id);
      if (error) throw error;
      toast.success(pack.featured ? 'Unfeatured' : 'Featured');
      load();
    } catch (err) {
      toast.error('Failed to update', { description: errMsg(err) });
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('starter_packs').delete().eq('id', deleteTarget.id);
      if (error) throw error;
      toast.success('Starter Pack deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error('Failed to delete', { description: errMsg(err) });
    } finally {
      setDeleting(false);
    }
  }

  const filtered = packs.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.industry ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Starter Packs</h2>
          <p className="text-sm text-muted-foreground">Create and manage curated software collections.</p>
        </div>
        <Button onClick={() => { setEditingPack(null); setShowEditor(true); }} className="bg-brand text-brand-foreground hover:bg-brand/90">
          <Plus className="mr-1.5 h-4 w-4" /> New Pack
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, slug, or industry…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-8 text-center">
          <AlertCircle className="h-6 w-6 text-destructive/70" />
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <Button size="sm" variant="outline" onClick={load}>Try again</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
          {packs.length === 0 ? 'No starter packs yet. Create your first one.' : 'No packs match your search.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pack) => (
            <div key={pack.id} className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Package className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-foreground">{pack.title}</h3>
                  {pack.published ? (
                    <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50">Published</Badge>
                  ) : (
                    <Badge variant="outline">Draft</Badge>
                  )}
                  {pack.featured && (
                    <Badge className="bg-amber-50 text-amber-600 hover:bg-amber-50">
                      <Star className="mr-1 h-3 w-3 fill-current" /> Featured
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {pack.short_description || pack.industry || `/${pack.slug}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={() => toggleFeaturedPack(pack)} title={pack.featured ? 'Unfeature' : 'Feature'}>
                  <Star className={cn('h-4 w-4', pack.featured ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/50')} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => togglePublish(pack)} title={pack.published ? 'Unpublish' : 'Publish'}>
                  {pack.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditingPack(pack); setShowEditor(true); }} title="Edit">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(pack)} title="Delete" className="text-red-500 hover:text-red-600">
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

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes this Starter Pack and its own FAQs. Its links to software products,
              categories, blog posts, and Needs will also be removed — but the products, categories, blog
              posts, and Needs themselves are <strong>not</strong> deleted, only their association with this
              pack. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

function PackEditor({ pack, onClose, onSaved }: { pack: StarterPack | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(pack?.title ?? '');
  const [slug, setSlug] = useState(pack?.slug ?? '');
  const [description, setDescription] = useState(pack?.description ?? '');
  const [shortDescription, setShortDescription] = useState(pack?.short_description ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(pack?.cover_image_url ?? '');
  const [industry, setIndustry] = useState(pack?.industry ?? '');
  const [published, setPublished] = useState(pack?.published ?? false);
  const [featured, setFeatured] = useState(pack?.featured ?? false);
  const [sortOrder, setSortOrder] = useState(pack?.sort_order ?? 0);
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

  // Blog posts
  const [allBlogPosts, setAllBlogPosts] = useState<BlogPost[]>([]);
  const [packBlogPosts, setPackBlogPosts] = useState<any[]>([]);

  // Needs
  const [allNeeds, setAllNeeds] = useState<Need[]>([]);
  const [packNeeds, setPackNeeds] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('products').select('id, name, tagline, logo_url, pricing, paid').eq('paid', true).order('name')
      .then(({ data, error }) => {
        if (error) { toast.error('Failed to load products', { description: error.message }); return; }
        setAllProducts((data as Product[]) ?? []);
      });
    supabase.from('categories').select('*').order('name')
      .then(({ data, error }) => {
        if (error) { toast.error('Failed to load categories', { description: error.message }); return; }
        setAllCategories((data as Category[]) ?? []);
      });
    // Admin sees every post (draft + published) -- an admin may legitimately
    // want to pre-link an upcoming post before it goes live. RLS already
    // restricts who can reach this component at all.
    supabase.from('blog_posts').select('id, title, slug, published').order('title')
      .then(({ data, error }) => {
        if (error) { toast.error('Failed to load blog posts', { description: error.message }); return; }
        setAllBlogPosts((data as BlogPost[]) ?? []);
      });
    // Needs have no draft/published concept (every need is already public).
    // Capped at 300, alphabetical, so the picker stays usable without a
    // separate debounced-search round trip.
    supabase.from('needs').select('id, title, status').order('title').limit(300)
      .then(({ data, error }) => {
        if (error) { toast.error('Failed to load needs', { description: error.message }); return; }
        setAllNeeds((data as Need[]) ?? []);
      });
  }, []);

  useEffect(() => {
    if (!pack) return;
    supabase.from('starter_pack_products').select(`id, product_id, sort_order, featured, blurb, role_label, best_for_label, pricing_label, product:products(id, name, tagline)`)
      .eq('starter_pack_id', pack.id).order('sort_order')
      .then(({ data, error }) => {
        if (error) { toast.error('Failed to load pack products', { description: error.message }); return; }
        setPackProducts(data ?? []);
      });
    supabase.from('starter_pack_faqs').select('*').eq('starter_pack_id', pack.id).order('sort_order')
      .then(({ data, error }) => {
        if (error) { toast.error('Failed to load FAQs', { description: error.message }); return; }
        setFaqs((data as StarterPackFaq[]) ?? []);
      });
    supabase.from('starter_pack_categories').select('category_id').eq('starter_pack_id', pack.id)
      .then(({ data, error }) => {
        if (error) { toast.error('Failed to load categories', { description: error.message }); return; }
        setPackCategoryIds((data ?? []).map((d: any) => d.category_id));
      });
    supabase.from('starter_pack_blog_posts').select(`id, blog_post_id, sort_order, blog_post:blog_posts(id, title, slug, published)`)
      .eq('starter_pack_id', pack.id).order('sort_order')
      .then(({ data, error }) => {
        if (error) { toast.error('Failed to load linked blog posts', { description: error.message }); return; }
        setPackBlogPosts(data ?? []);
      });
    supabase.from('starter_pack_needs').select(`id, need_id, sort_order, need:needs(id, title, status)`)
      .eq('starter_pack_id', pack.id).order('sort_order')
      .then(({ data, error }) => {
        if (error) { toast.error('Failed to load linked Needs', { description: error.message }); return; }
        setPackNeeds(data ?? []);
      });
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
      featured,
      sort_order: sortOrder,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
    };

    try {
      let packId = pack?.id;

      if (pack) {
        const { error } = await supabase.from('starter_packs').update(payload).eq('id', pack.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('starter_packs').insert(payload).select('id').single();
        if (error) throw error;
        packId = data.id;
      }

      // Save categories
      const { error: catDelErr } = await supabase.from('starter_pack_categories').delete().eq('starter_pack_id', packId);
      if (catDelErr) throw catDelErr;
      if (packCategoryIds.length > 0) {
        const { error: catInsErr } = await supabase.from('starter_pack_categories').insert(
          packCategoryIds.map((cid) => ({ starter_pack_id: packId, category_id: cid }))
        );
        if (catInsErr) throw catInsErr;
      }

      // Save FAQs
      const { error: faqDelErr } = await supabase.from('starter_pack_faqs').delete().eq('starter_pack_id', packId);
      if (faqDelErr) throw faqDelErr;
      if (faqs.length > 0) {
        const { error: faqInsErr } = await supabase.from('starter_pack_faqs').insert(
          faqs.map((f, i) => ({ starter_pack_id: packId, question: f.question, answer: f.answer, sort_order: i }))
        );
        if (faqInsErr) throw faqInsErr;
      }

      toast.success('Saved');
      onSaved();
    } catch (err) {
      toast.error('Failed to save', { description: errMsg(err) });
    } finally {
      setSaving(false);
    }
  }

  // --- Products -------------------------------------------------------

  async function refetchPackProducts() {
    if (!pack) return;
    const { data, error } = await supabase.from('starter_pack_products')
      .select(`id, product_id, sort_order, featured, blurb, role_label, best_for_label, pricing_label, product:products(id, name, tagline)`)
      .eq('starter_pack_id', pack.id).order('sort_order');
    if (error) { toast.error('Failed to refresh products', { description: error.message }); return; }
    setPackProducts(data ?? []);
  }

  async function addProduct() {
    if (!selectedProductId || !pack) return;
    try {
      const { error } = await supabase.from('starter_pack_products').insert({
        starter_pack_id: pack.id,
        product_id: selectedProductId,
        sort_order: packProducts.length > 0
          ? Math.max(...packProducts.map((p) => p.sort_order)) + 1
          : 0,
      });
      if (error) throw error;
      setSelectedProductId('');
      await refetchPackProducts();
    } catch (err) {
      toast.error('Failed to add product', { description: errMsg(err) });
    }
  }

  async function removeProduct(ppId: string) {
    if (!pack) return;
    const { error } = await supabase.from('starter_pack_products').delete().eq('id', ppId);
    if (error) { toast.error('Failed to remove product', { description: error.message }); return; }
    await refetchPackProducts();
  }

  async function toggleFeatured(pp: any) {
    if (!pack) return;
    const { error } = await supabase.from('starter_pack_products').update({ featured: !pp.featured }).eq('id', pp.id);
    if (error) { toast.error('Failed to update', { description: error.message }); return; }
    setPackProducts((prev) => prev.map((p) => p.id === pp.id ? { ...p, featured: !p.featured } : p));
  }

  async function updateProductField(ppId: string, field: 'role_label' | 'best_for_label' | 'pricing_label' | 'blurb', value: string) {
    const trimmed = value.trim() || null;
    const { error } = await supabase.from('starter_pack_products').update({ [field]: trimmed }).eq('id', ppId);
    if (error) { toast.error('Failed to save', { description: error.message }); return; }
    setPackProducts((prev) => prev.map((p) => p.id === ppId ? { ...p, [field]: trimmed } : p));
  }

  async function reorderProduct(pp: any, direction: 'up' | 'down') {
    if (!pack) return;
    const sorted = [...packProducts].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((p) => p.id === pp.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    try {
      const [r1, r2] = await Promise.all([
        supabase.from('starter_pack_products').update({ sort_order: b.sort_order }).eq('id', a.id),
        supabase.from('starter_pack_products').update({ sort_order: a.sort_order }).eq('id', b.id),
      ]);
      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;
      await refetchPackProducts();
    } catch (err) {
      toast.error('Failed to reorder', { description: errMsg(err) });
    }
  }

  // --- Blog posts -------------------------------------------------------

  async function refetchPackBlogPosts() {
    if (!pack) return;
    const { data, error } = await supabase.from('starter_pack_blog_posts')
      .select(`id, blog_post_id, sort_order, blog_post:blog_posts(id, title, slug, published)`)
      .eq('starter_pack_id', pack.id).order('sort_order');
    if (error) { toast.error('Failed to refresh blog posts', { description: error.message }); return; }
    setPackBlogPosts(data ?? []);
  }

  async function addBlogPost(blogPostId: string) {
    if (!pack) return;
    try {
      const { error } = await supabase.from('starter_pack_blog_posts').insert({
        starter_pack_id: pack.id,
        blog_post_id: blogPostId,
        sort_order: packBlogPosts.length > 0
          ? Math.max(...packBlogPosts.map((p) => p.sort_order)) + 1
          : 0,
      });
      if (error) throw error;
      await refetchPackBlogPosts();
    } catch (err) {
      toast.error('Failed to link blog post', { description: errMsg(err) });
    }
  }

  async function removeBlogPost(linkId: string) {
    const { error } = await supabase.from('starter_pack_blog_posts').delete().eq('id', linkId);
    if (error) { toast.error('Failed to remove blog post', { description: error.message }); return; }
    await refetchPackBlogPosts();
  }

  async function reorderBlogPost(link: any, direction: 'up' | 'down') {
    const sorted = [...packBlogPosts].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((l) => l.id === link.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    try {
      const [r1, r2] = await Promise.all([
        supabase.from('starter_pack_blog_posts').update({ sort_order: b.sort_order }).eq('id', a.id),
        supabase.from('starter_pack_blog_posts').update({ sort_order: a.sort_order }).eq('id', b.id),
      ]);
      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;
      await refetchPackBlogPosts();
    } catch (err) {
      toast.error('Failed to reorder', { description: errMsg(err) });
    }
  }

  // --- Needs -------------------------------------------------------

  async function refetchPackNeeds() {
    if (!pack) return;
    const { data, error } = await supabase.from('starter_pack_needs')
      .select(`id, need_id, sort_order, need:needs(id, title, status)`)
      .eq('starter_pack_id', pack.id).order('sort_order');
    if (error) { toast.error('Failed to refresh Needs', { description: error.message }); return; }
    setPackNeeds(data ?? []);
  }

  async function addNeed(needId: string) {
    if (!pack) return;
    try {
      const { error } = await supabase.from('starter_pack_needs').insert({
        starter_pack_id: pack.id,
        need_id: needId,
        sort_order: packNeeds.length > 0
          ? Math.max(...packNeeds.map((n) => n.sort_order)) + 1
          : 0,
      });
      if (error) throw error;
      await refetchPackNeeds();
    } catch (err) {
      toast.error('Failed to link Need', { description: errMsg(err) });
    }
  }

  async function removeNeed(linkId: string) {
    const { error } = await supabase.from('starter_pack_needs').delete().eq('id', linkId);
    if (error) { toast.error('Failed to remove Need', { description: error.message }); return; }
    await refetchPackNeeds();
  }

  async function reorderNeed(link: any, direction: 'up' | 'down') {
    const sorted = [...packNeeds].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((l) => l.id === link.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    try {
      const [r1, r2] = await Promise.all([
        supabase.from('starter_pack_needs').update({ sort_order: b.sort_order }).eq('id', a.id),
        supabase.from('starter_pack_needs').update({ sort_order: a.sort_order }).eq('id', b.id),
      ]);
      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;
      await refetchPackNeeds();
    } catch (err) {
      toast.error('Failed to reorder', { description: errMsg(err) });
    }
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

  const blogPostOptions: SearchOption[] = allBlogPosts
    .filter((bp) => !packBlogPosts.some((l) => l.blog_post_id === bp.id))
    .map((bp) => ({ id: bp.id, label: bp.title, sublabel: bp.published ? 'Published' : 'Draft' }));

  const needOptions: SearchOption[] = allNeeds
    .filter((n) => !packNeeds.some((l) => l.need_id === n.id))
    .map((n) => ({ id: n.id, label: n.title, sublabel: n.status }));

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

          {/* Pack metadata: publish, feature, ordering */}
          <div className="grid gap-4 rounded-xl border border-border/60 p-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <Switch checked={published} onCheckedChange={setPublished} />
              <Label>Published</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={featured} onCheckedChange={setFeatured} />
              <Label className="flex items-center gap-1"><Crown className="h-3.5 w-3.5 text-amber-500" /> Featured</Label>
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first on the public list.</p>
            </div>
            <div className="space-y-2">
              <Label>Published At</Label>
              <p className="rounded-md border border-border/40 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                {formatDateTime(pack?.published_at ?? null)}
              </p>
              <p className="text-xs text-muted-foreground">Set automatically the first time this pack is published — not editable.</p>
            </div>
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
              <div className="space-y-3">
                {packProducts.map((pp, i) => (
                  <div key={pp.id} className="space-y-2 rounded-lg border border-border/40 p-3">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/30" />
                      <span className="flex-1 text-sm font-medium text-foreground">{pp.product?.name || 'Unknown'}</span>
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
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Input
                        defaultValue={pp.role_label ?? ''}
                        onBlur={(e) => updateProductField(pp.id, 'role_label', e.target.value)}
                        placeholder="Role, e.g. CRM"
                        className="text-xs"
                      />
                      <Input
                        defaultValue={pp.best_for_label ?? ''}
                        onBlur={(e) => updateProductField(pp.id, 'best_for_label', e.target.value)}
                        placeholder="Best for, e.g. Solo freelancers"
                        className="text-xs"
                      />
                      <Input
                        defaultValue={pp.pricing_label ?? ''}
                        onBlur={(e) => updateProductField(pp.id, 'pricing_label', e.target.value)}
                        placeholder="Pricing note, e.g. Budget pick"
                        className="text-xs"
                      />
                    </div>
                    <Textarea
                      defaultValue={pp.blurb ?? ''}
                      onBlur={(e) => updateProductField(pp.id, 'blurb', e.target.value)}
                      placeholder="Why this product is recommended in this pack"
                      rows={2}
                      className="text-xs"
                    />
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

          {/* Blog posts */}
          {pack && (
            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <h3 className="flex items-center gap-1.5 font-medium text-foreground"><FileText className="h-4 w-4" /> Related Blog Articles</h3>
              <SearchSelectPopover
                options={blogPostOptions}
                onSelect={addBlogPost}
                placeholder="Search blog posts to link…"
                emptyText={allBlogPosts.length === 0 ? 'No blog posts exist yet.' : 'No matching posts.'}
              />
              <div className="space-y-2">
                {[...packBlogPosts].sort((a, b) => a.sort_order - b.sort_order).map((link, i, arr) => (
                  <div key={link.id} className="flex items-center gap-2 rounded-lg border border-border/40 p-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground/30" />
                    <span className="flex-1 truncate text-sm text-foreground">{link.blog_post?.title || 'Unknown post'}</span>
                    {link.blog_post && !link.blog_post.published && <Badge variant="outline" className="text-xs">Draft</Badge>}
                    <button onClick={() => reorderBlogPost(link, 'up')} disabled={i === 0} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => reorderBlogPost(link, 'down')} disabled={i === arr.length - 1} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button onClick={() => removeBlogPost(link.id)} className="rounded p-1 text-red-500 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {packBlogPosts.length === 0 && <p className="text-xs text-muted-foreground">No blog posts linked yet.</p>}
              </div>
            </div>
          )}

          {/* Needs */}
          {pack && (
            <div className="space-y-3 rounded-xl border border-border/60 p-4">
              <h3 className="flex items-center gap-1.5 font-medium text-foreground"><Lightbulb className="h-4 w-4" /> Related Needs</h3>
              <SearchSelectPopover
                options={needOptions}
                onSelect={addNeed}
                placeholder="Search Needs to link…"
                emptyText={allNeeds.length === 0 ? 'No Needs exist yet.' : 'No matching Needs.'}
              />
              <div className="space-y-2">
                {[...packNeeds].sort((a, b) => a.sort_order - b.sort_order).map((link, i, arr) => (
                  <div key={link.id} className="flex items-center gap-2 rounded-lg border border-border/40 p-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground/30" />
                    <span className="flex-1 truncate text-sm text-foreground">{link.need?.title || 'Unknown need'}</span>
                    {link.need && <Badge variant="outline" className="text-xs">{link.need.status}</Badge>}
                    <button onClick={() => reorderNeed(link, 'up')} disabled={i === 0} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => reorderNeed(link, 'down')} disabled={i === arr.length - 1} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button onClick={() => removeNeed(link.id)} className="rounded p-1 text-red-500 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {packNeeds.length === 0 && <p className="text-xs text-muted-foreground">No Needs linked yet.</p>}
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
