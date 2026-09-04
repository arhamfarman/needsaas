'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  ArrowLeft,
  Save,
  X,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  FileEdit,
  Loader2,
  Eye,
  ImageIcon,
  Tag as TagIcon,
  Globe as SeoIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { markdownToHtml } from '@/lib/markdown';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Status = 'draft' | 'scheduled' | 'published';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  published: boolean;
  status: string;
  published_at: string | null;
  scheduled_at: string | null;
  author_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  og_image_url: string | null;
  created_at: string;
  updated_at: string;
};

type BlogTag = {
  id: string;
  name: string;
  slug: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Markdown → HTML rendering lives in @/lib/markdown (shared with the public
// blog pages so the admin preview and the live page render identically).

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'published':
      return (
        <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Published
        </Badge>
      );
    case 'scheduled':
      return (
        <Badge className="border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-100">
          <Clock className="mr-1 h-3 w-3" />
          Scheduled
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          <FileEdit className="mr-1 h-3 w-3" />
          Draft
        </Badge>
      );
  }
}

// ---------------------------------------------------------------------------
// Preview styles (Tailwind arbitrary variants)
// ---------------------------------------------------------------------------

const previewClasses = cn(
  'max-w-none',
  '[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:tracking-tight',
  '[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5 [&_h2]:tracking-tight',
  '[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4',
  '[&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mb-2 [&_h4]:mt-3',
  '[&_h5]:text-base [&_h5]:font-semibold [&_h5]:mb-2 [&_h5]:mt-3',
  '[&_h6]:text-sm [&_h6]:font-semibold [&_h6]:mb-2 [&_h6]:mt-3',
  '[&_p]:mb-4 [&_p]:leading-relaxed',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1',
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1',
  '[&_li]:leading-relaxed',
  '[&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:mb-4',
  '[&_blockquote_p]:mb-1',
  '[&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4 [&_pre]:text-sm',
  '[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-foreground',
  '[&_img]:rounded-lg [&_img]:max-w-full [&_img]:h-auto [&_img]:mb-4',
  '[&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2',
  '[&_hr]:border-border [&_hr]:my-6',
  '[&_strong]:font-semibold',
  '[&_em]:italic',
  '[&_del]:line-through'
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  status: 'draft' as Status,
  scheduled_at: '',
  seo_title: '',
  seo_description: '',
  canonical_url: '',
  og_image_url: '',
};

export default function BlogCMSPage() {
  const { user } = useAuth();

  // Data
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [mode, setMode] = useState<'list' | 'editor'>('list');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [previewTab, setPreviewTab] = useState('write');

  // Form state
  const [form, setForm] = useState({ ...emptyForm });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [slugEdited, setSlugEdited] = useState(false);

  // --- Data loading --------------------------------------------------------

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load posts: ' + error.message);
    } else {
      setPosts((data as BlogPost[]) ?? []);
    }
    setLoading(false);
  }, []);

  const loadTags = useCallback(async () => {
    const { data, error } = await supabase
      .from('blog_tags')
      .select('*')
      .order('name');
    if (error) {
      toast.error('Failed to load tags: ' + error.message);
    } else {
      setTags((data as BlogTag[]) ?? []);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    loadTags();
  }, [loadPosts, loadTags]);

  // --- Derived: filtered posts ---------------------------------------------

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchesStatus =
        statusFilter === 'all' || p.status === statusFilter;
      const matchesSearch =
        search.trim() === '' ||
        p.title.toLowerCase().includes(search.toLowerCase().trim());
      return matchesStatus && matchesSearch;
    });
  }, [posts, statusFilter, search]);

  // --- Stats ---------------------------------------------------------------

  const stats = useMemo(() => {
    return {
      total: posts.length,
      drafts: posts.filter((p) => p.status === 'draft').length,
      scheduled: posts.filter((p) => p.status === 'scheduled').length,
      published: posts.filter((p) => p.status === 'published').length,
    };
  }, [posts]);

  // --- Form helpers --------------------------------------------------------

  function updateForm(field: keyof typeof form, value: string) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      // Auto-generate slug from title unless user manually edited the slug
      if (field === 'title' && !slugEdited) {
        next.slug = slugify(value);
      }
      return next;
    });
  }

  // --- Editor open/close ---------------------------------------------------

  async function openEditor(post: BlogPost | null) {
    if (post) {
      setEditingPost(post);
      setForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? '',
        content: post.content ?? '',
        cover_image_url: post.cover_image_url ?? '',
        status: (post.status as Status) || 'draft',
        scheduled_at: toDatetimeLocal(post.scheduled_at),
        seo_title: post.seo_title ?? '',
        seo_description: post.seo_description ?? '',
        canonical_url: post.canonical_url ?? '',
        og_image_url: post.og_image_url ?? '',
      });
      setSlugEdited(true);
      // Load existing tags for this post
      const { data: ptData } = await supabase
        .from('blog_post_tags')
        .select('blog_tag_id')
        .eq('blog_post_id', post.id);
      setSelectedTagIds(
        (ptData ?? []).map((r: { blog_tag_id: string }) => r.blog_tag_id)
      );
    } else {
      setEditingPost(null);
      setForm({ ...emptyForm });
      setSlugEdited(false);
      setSelectedTagIds([]);
    }
    setPreviewTab('write');
    setMode('editor');
  }

  function closeEditor() {
    setMode('list');
    setEditingPost(null);
    setForm({ ...emptyForm });
    setSelectedTagIds([]);
    setSlugEdited(false);
  }

  // --- Save ----------------------------------------------------------------

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!form.slug.trim()) {
      toast.error('Slug is required');
      return;
    }
    if (form.status === 'scheduled' && !form.scheduled_at) {
      toast.error('Please choose a scheduled date and time');
      return;
    }

    setSaving(true);

    const now = new Date().toISOString();

    const baseData: Record<string, unknown> = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim() || null,
      content: form.content || null,
      cover_image_url: form.cover_image_url.trim() || null,
      status: form.status,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      canonical_url: form.canonical_url.trim() || null,
      og_image_url: form.og_image_url.trim() || null,
    };

    if (form.status === 'published') {
      baseData.published = true;
      // Only set published_at on first publish — keep original on re-save
      if (!editingPost || !editingPost.published_at) {
        baseData.published_at = now;
      }
    } else if (form.status === 'draft') {
      baseData.published = false;
    } else if (form.status === 'scheduled') {
      baseData.published = false;
      baseData.scheduled_at = new Date(form.scheduled_at).toISOString();
    }

    let postId: string;

    if (editingPost) {
      // Update
      const { data, error } = await supabase
        .from('blog_posts')
        .update({ ...baseData, updated_at: now })
        .eq('id', editingPost.id)
        .select('id')
        .single();
      if (error) {
        toast.error('Failed to update post: ' + error.message);
        setSaving(false);
        return;
      }
      postId = (data as { id: string }).id;
    } else {
      // Create
      const { data, error } = await supabase
        .from('blog_posts')
        .insert({ ...baseData, author_id: user?.id ?? null })
        .select('id')
        .single();
      if (error) {
        toast.error('Failed to create post: ' + error.message);
        setSaving(false);
        return;
      }
      postId = (data as { id: string }).id;
    }

    // Sync tags: delete existing then insert new
    const { error: delError } = await supabase
      .from('blog_post_tags')
      .delete()
      .eq('blog_post_id', postId);
    if (delError) {
      toast.error('Failed to sync tags: ' + delError.message);
      setSaving(false);
      return;
    }

    if (selectedTagIds.length > 0) {
      const { error: tagError } = await supabase
        .from('blog_post_tags')
        .insert(
          selectedTagIds.map((tag_id) => ({
            blog_post_id: postId,
            blog_tag_id: tag_id,
          }))
        );
      if (tagError) {
        toast.error('Failed to save tags: ' + tagError.message);
        setSaving(false);
        return;
      }
    }

    toast.success(editingPost ? 'Post updated successfully' : 'Post created successfully');
    setSaving(false);
    closeEditor();
    loadPosts();
  }

  // --- Delete --------------------------------------------------------------

  async function handleDelete(post: BlogPost) {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', post.id);
    if (error) {
      toast.error('Failed to delete post: ' + error.message);
      return;
    }
    toast.success('Post deleted');
    loadPosts();
  }

  // -------------------------------------------------------------------------
  // Render: List mode
  // -------------------------------------------------------------------------

  if (mode === 'editor') {
    return (
      <EditorView
        form={form}
        updateForm={updateForm}
        slugEdited={slugEdited}
        setSlugEdited={setSlugEdited}
        tags={tags}
        selectedTagIds={selectedTagIds}
        setSelectedTagIds={setSelectedTagIds}
        editingPost={editingPost}
        saving={saving}
        onSave={handleSave}
        onCancel={closeEditor}
        previewTab={previewTab}
        setPreviewTab={setPreviewTab}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Blog CMS
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, edit, and manage your blog posts.
          </p>
        </div>
        <Button
          onClick={() => openEditor(null)}
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Total"
          value={stats.total}
          tone="default"
        />
        <StatCard
          icon={FileEdit}
          label="Drafts"
          value={stats.drafts}
          tone="muted"
        />
        <StatCard
          icon={Clock}
          label="Scheduled"
          value={stats.scheduled}
          tone="amber"
        />
        <StatCard
          icon={CheckCircle2}
          label="Published"
          value={stats.published}
          tone="emerald"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Post list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">
            {posts.length === 0 ? 'No blog posts yet' : 'No posts match your filters'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {posts.length === 0
              ? 'Create your first post to get started.'
              : 'Try adjusting your search or status filter.'}
          </p>
          {posts.length === 0 && (
            <Button
              onClick={() => openEditor(null)}
              className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          {/* Table header — hidden on mobile */}
          <div className="hidden grid-cols-12 gap-4 border-b border-border bg-muted/50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
            <div className="col-span-5">Title</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Date</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="grid grid-cols-1 gap-3 px-4 py-4 transition-colors hover:bg-muted/30 md:grid-cols-12 md:gap-4 md:items-center"
              >
                {/* Title */}
                <div className="md:col-span-5">
                  <p className="font-medium text-foreground line-clamp-1">
                    {post.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    /{post.slug}
                  </p>
                </div>

                {/* Status */}
                <div className="md:col-span-2">
                  <StatusBadge status={post.status} />
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-3">
                  {post.status === 'scheduled' ? (
                    <>
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatDateTime(post.scheduled_at)}</span>
                    </>
                  ) : post.status === 'published' ? (
                    <>
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{formatDate(post.published_at)}</span>
                    </>
                  ) : (
                    <>
                      <FileEdit className="h-3.5 w-3.5 shrink-0" />
                      <span>Updated {formatDate(post.updated_at)}</span>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 md:col-span-2 md:justify-end">
                  {post.status === 'published' && (
                    <Button
                      asChild
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      title="View post"
                    >
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    title="Edit post"
                    onClick={() => openEditor(post)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Delete post"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete &ldquo;{post.title}
                          &rdquo;. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(post)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: 'default' | 'muted' | 'amber' | 'emerald';
}) {
  const toneClasses = {
    default: 'bg-brand/10 text-brand',
    muted: 'bg-muted text-muted-foreground',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          toneClasses[tone]
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Editor view
// ---------------------------------------------------------------------------

function EditorView({
  form,
  updateForm,
  slugEdited,
  setSlugEdited,
  tags,
  selectedTagIds,
  setSelectedTagIds,
  editingPost,
  saving,
  onSave,
  onCancel,
  previewTab,
  setPreviewTab,
}: {
  form: typeof emptyForm;
  updateForm: (field: keyof typeof emptyForm, value: string) => void;
  slugEdited: boolean;
  setSlugEdited: (v: boolean) => void;
  tags: BlogTag[];
  selectedTagIds: string[];
  setSelectedTagIds: React.Dispatch<React.SetStateAction<string[]>>;
  editingPost: BlogPost | null;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
  previewTab: string;
  setPreviewTab: (v: string) => void;
}) {
  const previewHtml = useMemo(
    () => markdownToHtml(form.content),
    [form.content]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-9 w-9"
            title="Back to list"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {editingPost ? 'Edit Post' : 'New Post'}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {editingPost
                ? `Editing “${editingPost.title}”`
                : 'Write a new blog post.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={saving}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? 'Saving…' : 'Save Post'}
          </Button>
        </div>
      </div>

      {/* Editor grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Title + slug */}
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter post title…"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                className="text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  (URL path)
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/blog/</span>
                <Input
                  id="slug"
                  placeholder="post-slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    updateForm('slug', slugify(e.target.value));
                  }}
                  className="flex-1"
                />
                {slugEdited && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSlugEdited(false);
                      updateForm('slug', slugify(form.title));
                    }}
                    title="Auto-generate from title"
                  >
                    Auto
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <Textarea
                id="excerpt"
                placeholder="A short summary shown in listings and search results…"
                value={form.excerpt}
                onChange={(e) => updateForm('excerpt', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Content editor with preview */}
          <div className="space-y-3 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <Label>Content (Markdown)</Label>
              <span className="text-xs text-muted-foreground">
                Supports headings, bold, links, lists, code blocks, images…
              </span>
            </div>
            <Tabs value={previewTab} onValueChange={setPreviewTab}>
              <TabsList>
                <TabsTrigger value="write" className="gap-1.5">
                  <FileEdit className="h-4 w-4" />
                  Write
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-1.5">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="write" className="mt-3">
                <Textarea
                  placeholder={
                    '# Heading\n\nWrite your post in **Markdown**.\n\n- List item\n- Another item\n\n[Link](https://example.com)\n\n```\ncode block\n```'
                  }
                  value={form.content}
                  onChange={(e) => updateForm('content', e.target.value)}
                  className="min-h-[520px] resize-y font-mono text-sm leading-relaxed"
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-3">
                <div
                  className={cn(
                    'min-h-[520px] overflow-y-auto rounded-lg border border-border bg-background p-6',
                    previewClasses
                  )}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          {/* Status & scheduling */}
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Status &amp; Scheduling
              </h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => updateForm('status', v)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Schedule</SelectItem>
                  <SelectItem value="published">Publish</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {form.status === 'draft' &&
                  'Saved as a draft — not visible publicly.'}
                {form.status === 'scheduled' &&
                  'Will be published automatically at the scheduled time.'}
                {form.status === 'published' &&
                  'Published and visible to everyone.'}
              </p>
            </div>
            {form.status === 'scheduled' && (
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">
                  Scheduled date &amp; time
                </Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) => updateForm('scheduled_at', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Cover image */}
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Cover Image
              </h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover_image_url">Cover image URL</Label>
              <Input
                id="cover_image_url"
                placeholder="https://example.com/cover.jpg"
                value={form.cover_image_url}
                onChange={(e) =>
                  updateForm('cover_image_url', e.target.value)
                }
              />
            </div>
            {form.cover_image_url.trim() && (
              <div className="overflow-hidden rounded-lg border border-border">
                <img
                  src={form.cover_image_url.trim()}
                  alt="Cover preview"
                  className="h-32 w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Tags</h3>
            </div>
            {tags.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No tags available. Add tags in the database to assign them to
                posts.
              </p>
            ) : (
              <div className="flex max-h-48 flex-wrap gap-x-4 gap-y-2 overflow-y-auto">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={selectedTagIds.includes(tag.id)}
                      onCheckedChange={(checked) => {
                        setSelectedTagIds((prev) =>
                          checked
                            ? [...prev, tag.id]
                            : prev.filter((id) => id !== tag.id)
                        );
                      }}
                    />
                    <span className="text-foreground">{tag.name}</span>
                  </label>
                ))}
              </div>
            )}
            {selectedTagIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 border-t border-border pt-3">
                {selectedTagIds.map((tid) => {
                  const t = tags.find((x) => x.id === tid);
                  if (!t) return null;
                  return (
                    <Badge
                      key={tid}
                      variant="secondary"
                      className="cursor-pointer gap-1"
                      onClick={() =>
                        setSelectedTagIds((prev) =>
                          prev.filter((id) => id !== tid)
                        )
                      }
                    >
                      {t.name}
                      <X className="h-3 w-3" />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* SEO */}
          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <SeoIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                SEO Fields
              </h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_title">
                SEO Title{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  ({form.seo_title.length}/60)
                </span>
              </Label>
              <Input
                id="seo_title"
                placeholder="Defaults to post title if empty"
                value={form.seo_title}
                onChange={(e) => updateForm('seo_title', e.target.value)}
                maxLength={60}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_description">
                Meta Description{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  ({form.seo_description.length}/160)
                </span>
              </Label>
              <Textarea
                id="seo_description"
                placeholder="Short description for search engines and social sharing…"
                value={form.seo_description}
                onChange={(e) =>
                  updateForm('seo_description', e.target.value)
                }
                rows={3}
                maxLength={160}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="canonical_url">Canonical URL</Label>
              <Input
                id="canonical_url"
                placeholder="https://example.com/original-post"
                value={form.canonical_url}
                onChange={(e) =>
                  updateForm('canonical_url', e.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="og_image_url">OG Image URL</Label>
              <Input
                id="og_image_url"
                placeholder="https://example.com/og-image.jpg"
                value={form.og_image_url}
                onChange={(e) => updateForm('og_image_url', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used for social media sharing previews. Falls back to cover
                image.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
