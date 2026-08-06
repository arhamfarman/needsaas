'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ImagePlus, X, Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const MAX_LOGO_SIZE = 512 * 1024; // 512KB
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_IMAGES = 6;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

type LogoUploaderProps = {
  logoUrl: string | null;
  onLogoChange: (url: string | null) => void;
};

export function LogoUploader({ logoUrl, onLogoChange }: LogoUploaderProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!user) return;
    if (!ALLOWED_TYPES.includes(file.type)) { toast.error('Please use PNG, JPG, WebP, or GIF'); return; }
    if (file.size > MAX_LOGO_SIZE) { toast.error('Logo must be under 512KB'); return; }

    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
    const path = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type });
    setUploading(false);
    if (error) { toast.error('Upload failed'); return; }
    onLogoChange(path);
    toast.success('Logo added');
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
      {logoUrl ? (
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-border bg-muted">
            <ImageFromBucket path={logoUrl} alt="Logo" fill />
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Replace'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onLogoChange(null)} className="text-muted-foreground hover:text-destructive">
              <X className="h-3.5 w-3.5" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          disabled={uploading}
          className={cn(
            'flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30 transition hover:border-brand/40 hover:bg-muted/50',
            uploading && 'opacity-50'
          )}
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <ImagePlus className="h-5 w-5 text-muted-foreground" />}
        </button>
      )}
      <p className="text-xs text-muted-foreground">Logo — PNG, JPG, or WebP. Max 512KB.</p>
    </div>
  );
}

type GalleryUploaderProps = {
  images: string[];
  onImagesChange: (images: string[]) => void;
};

export function GalleryUploader({ images, onImagesChange }: GalleryUploaderProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    if (!user) return;
    const fileArr = Array.from(files);
    if (images.length + fileArr.length > MAX_IMAGES) {
      toast.error(`You can upload up to ${MAX_IMAGES} images`);
      return;
    }

    for (const file of fileArr) {
      if (!ALLOWED_TYPES.includes(file.type)) { toast.error(`${file.name}: unsupported format`); continue; }
      if (file.size > MAX_IMAGE_SIZE) { toast.error(`${file.name}: must be under 2MB`); continue; }
    }

    setUploading(true);
    const uploaded: string[] = [];
    for (const file of fileArr) {
      if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE) continue;
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
      const path = `${user.id}/img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file, { contentType: file.type });
      if (!error) uploaded.push(path);
    }
    setUploading(false);
    if (uploaded.length > 0) {
      onImagesChange([...images, ...uploaded]);
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} added`);
    }
  }, [images, onImagesChange, user]);

  function removeImage(idx: number) {
    onImagesChange(images.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
      />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((img, i) => (
          <div key={i} className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
            <ImageFromBucket path={img} alt={`Product image ${i + 1}`} fill />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {images.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files) addFiles(e.dataTransfer.files); }}
            onDragOver={(e) => e.preventDefault()}
            disabled={uploading}
            className={cn(
              'flex aspect-video items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/30 transition hover:border-brand/40 hover:bg-muted/50',
              uploading && 'opacity-50'
            )}
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span className="text-[11px]">Add</span>
              </div>
            )}
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Product screenshots — up to {MAX_IMAGES} images. PNG, JPG, or WebP. Max 2MB each.</p>
    </div>
  );
}

// Fetch a signed URL for a private bucket path and render with next/image
function ImageFromBucket({ path, alt, fill }: { path: string; alt: string; fill?: boolean }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase.storage.from('product-images').createSignedUrl(path, 3600).then(({ data, error }) => {
      if (!error && data) setUrl(data.signedUrl);
    });
  }, [path]);

  if (!url) return <div className={fill ? 'absolute inset-0 animate-pulse bg-muted' : 'h-full w-full animate-pulse bg-muted'} />;
  if (fill) return <Image src={url} alt={alt} fill sizes="100%" className="object-cover" />;
  return <img src={url} alt={alt} className="h-full w-full object-cover" />;
}
