'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FolderTree,
  Package,
  Search,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type CategoryWithCount = Category & { product_count: number };

type FormState = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  seo_title: string;
  seo_description: string;
  long_description: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  slug: '',
  description: '',
  icon: '',
  seo_title: '',
  seo_description: '',
  long_description: '',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function CategoryManagementPage() {
  const [categories, setCategories] = React.useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState<CategoryWithCount | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const fetchCategories = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      const cats = (data ?? []) as Category[];

      if (cats.length === 0) {
        setCategories([]);
        return;
      }

      // Fetch product counts grouped by category_id
      const { data: productCounts, error: pcError } = await supabase
        .from('products')
        .select('category_id');

      if (pcError) throw pcError;

      const countMap = new Map<string, number>();
      for (const row of productCounts ?? []) {
        const cid = (row as { category_id: string | null }).category_id;
        if (cid) countMap.set(cid, (countMap.get(cid) ?? 0) + 1);
      }

      const merged: CategoryWithCount[] = cats.map((c) => ({
        ...c,
        product_count: countMap.get(c.id) ?? 0,
      }));

      setCategories(merged);
    } catch (err) {
      toast.error('Failed to load categories', {
        description: err instanceof Error ? err.message : 'Unexpected error',
      });
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setDialogOpen(true);
  };

  const openEdit = (cat: CategoryWithCount) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      icon: cat.icon ?? '',
      seo_title: cat.seo_title ?? '',
      seo_description: cat.seo_description ?? '',
      long_description: cat.long_description ?? '',
    });
    setSlugTouched(true);
    setDialogOpen(true);
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'name' && !slugTouched) {
        next.slug = slugify(value as string);
      }
      if (key === 'slug') {
        next.slug = slugify(value as string);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!form.slug.trim()) {
      toast.error('Slug is required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || null,
        icon: form.icon.trim() || null,
        seo_title: form.seo_title.trim() || null,
        seo_description: form.seo_description.trim() || null,
        long_description: form.long_description.trim() || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Category updated');
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
        toast.success('Category created');
      }

      setDialogOpen(false);
      await fetchCategories();
    } catch (err) {
      toast.error('Failed to save category', {
        description: err instanceof Error ? err.message : 'Unexpected error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success('Category deleted');
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Failed to delete category', {
        description: err instanceof Error ? err.message : 'Unexpected error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q),
    );
  }, [categories, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Category Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize software into categories with SEO metadata.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Category
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filtered.length} categor{filtered.length === 1 ? 'y' : 'ies'}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Category</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="min-w-[220px]">Description</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  {search ? 'No categories match your search.' : 'No categories yet. Create one to get started.'}
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence initial={false}>
                {filtered.map((cat) => (
                  <motion.tr
                    key={cat.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {cat.icon ? (
                        <span className="text-lg leading-none" aria-hidden>{cat.icon}</span>
                        ) : (
                        <FolderTree className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-foreground">{cat.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {cat.slug}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-[260px]">
                      {cat.description ? (
                        <span className="line-clamp-2 text-sm text-muted-foreground">
                          {cat.description}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {cat.icon ? <span className="text-lg" aria-hidden>{cat.icon}</span> : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="gap-1">
                        <Package className="h-3 w-3" /> {cat.product_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(cat)}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            setDeleteTarget(cat);
                            setDeleteOpen(true);
                          }}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Category' : 'New Category'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update category details and SEO metadata.'
                : 'Create a new category for organizing software.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="cat-name">Name *</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Developer Tools"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cat-slug">Slug *</Label>
              <Input
                id="cat-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  updateField('slug', e.target.value);
                }}
                placeholder="developer-tools"
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated from name. Edit if needed.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cat-icon">Icon</Label>
              <Input
                id="cat-icon"
                value={form.icon}
                onChange={(e) => updateField('icon', e.target.value)}
                placeholder="Emoji or icon name (e.g. 🛠️)"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Short description shown on category listings"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cat-long">Long Description</Label>
              <Textarea
                id="cat-long"
                value={form.long_description}
                onChange={(e) => updateField('long_description', e.target.value)}
                placeholder="Detailed description for the category page"
                rows={3}
              />
            </div>

            <div className="rounded-lg border border-border/60 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                SEO
              </p>
              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="cat-seo-title">SEO Title</Label>
                  <Input
                    id="cat-seo-title"
                    value={form.seo_title}
                    onChange={(e) => updateField('seo_title', e.target.value)}
                    placeholder="Meta title for search engines"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cat-seo-desc">SEO Description</Label>
                  <Textarea
                    id="cat-seo-desc"
                    value={form.seo_description}
                    onChange={(e) => updateField('seo_description', e.target.value)}
                    placeholder="Meta description for search engines"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                </>
              ) : editingId ? (
                'Save changes'
              ) : (
                'Create category'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete category?</DialogTitle>
            <DialogDescription>
              This permanently deletes{' '}
              <span className="font-medium text-foreground">“{deleteTarget?.name}”</span>
              {deleteTarget && deleteTarget.product_count > 0 && (
                <>
                  {' '}— it currently has{' '}
                  <span className="font-medium text-foreground">
                    {deleteTarget.product_count}
                  </span>{' '}
                  product{deleteTarget.product_count === 1 ? '' : 's'} which will lose their
                  category assignment.
                </>
              )}
              {' '}This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete category
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
