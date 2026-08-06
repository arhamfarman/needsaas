'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

type ProductImageProps = {
  path: string | null | undefined;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  fallback?: React.ReactNode;
};

/**
 * Resolves a private storage path into a signed URL and renders the image.
 * Shows a skeleton pulse while loading and an optional fallback if no path.
 */
export function ProductImage({ path, alt, className, fill, sizes, fallback }: ProductImageProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);

  useEffect(() => {
    if (!path) { setUrl(null); setLoading(false); return; }
    setLoading(true);
    supabase.storage.from('product-images').createSignedUrl(path, 3600).then(({ data, error }) => {
      setUrl(!error && data ? data.signedUrl : null);
      setLoading(false);
    });
  }, [path]);

  if (!path || !url) {
    if (fallback) return <>{fallback}</>;
    return <div className={`${className ?? ''} ${fill ? 'absolute inset-0' : ''} animate-pulse bg-muted`} />;
  }

  if (fill) {
    return <Image src={url} alt={alt} fill sizes={sizes ?? '100%'} className={className ?? 'object-cover'} />;
  }
  return <img src={url} alt={alt} className={className ?? ''} />;
}
