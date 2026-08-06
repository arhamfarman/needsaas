import Link from 'next/link';
import { Star, ExternalLink } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ProductImage } from '@/components/product-image';
import { VerifiedBadge } from '@/components/verified-badge';
import { cn } from '@/lib/utils';

export function ProductCard({ product, showPaidBadge }: { product: Product; showPaidBadge?: boolean }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border/60 bg-white transition-all duration-200 hover:border-border hover:shadow-card-hover">
      <Link href={`/products/${product.id}`} className="flex-1">
        {/* Thumbnail: first screenshot or logo */}
        <div className="relative aspect-[16/9] overflow-hidden bg-muted/30">
          {product.images && product.images.length > 0 ? (
            <ProductImage path={product.images[0]} alt={`${product.name} screenshot`} fill sizes="400px" />
          ) : product.logo_url ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="relative h-16 w-16 overflow-hidden rounded-xl">
                <ProductImage path={product.logo_url} alt={`${product.name} logo`} fill sizes="64px" />
              </div>
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/40 to-muted/10">
              <span className="font-display text-2xl font-bold text-muted-foreground/30">
                {product.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-3 p-4">
          <div className="flex items-start gap-2.5">
            {/* Small logo */}
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
              {product.logo_url ? (
                <ProductImage path={product.logo_url} alt={`${product.name} logo`} fill sizes="32px" fallback={
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand/20 to-brand/5 text-[10px] font-bold text-brand">
                    {product.name.slice(0, 2).toUpperCase()}
                  </div>
                } />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand/20 to-brand/5 text-[10px] font-bold text-brand">
                  {product.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-brand">{product.name}</h3>
                {product.url && (
                  <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">{product.tagline}</p>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {product.category && (
              <Link href={`/software/${product.category.slug}`}>
                <Badge variant="outline" className="border-border/50 px-2 py-0 text-[10px] font-medium text-muted-foreground hover:border-brand hover:text-brand">
                  {product.category.name}
                </Badge>
              </Link>
            )}
            {product.pricing && (
              <Badge variant="outline" className="border-border/50 px-2 py-0 text-[10px] font-medium text-muted-foreground">
                {product.pricing}
              </Badge>
            )}
            {product.price_from && (
              <Badge variant="outline" className="border-brand/20 px-2 py-0 text-[10px] font-medium text-brand">
                From {product.price_from}
              </Badge>
            )}
            {showPaidBadge && !product.paid && (
              <Badge variant="outline" className="border-amber-500/30 px-2 py-0 text-[10px] font-medium text-amber-600">
                Unpaid
              </Badge>
            )}
          </div>
        </div>
      </Link>

      {/* Footer: rating + view button */}
      <div className="flex items-center justify-between border-t border-border/40 px-4 py-2.5">
        {product.review_count > 0 ? (
          <div className="flex items-center gap-1 text-xs font-medium text-foreground">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {Number(product.avg_rating).toFixed(1)}
            <span className="text-muted-foreground">({product.review_count})</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">New</span>
        )}
        <Button asChild size="sm" variant="ghost" className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground">
          <Link href={`/products/${product.id}`}>View</Link>
        </Button>
      </div>
    </div>
  );
}

export function ProductRowMini({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 p-3 transition hover:bg-card hover:border-border"
    >
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
        {product.logo_url ? (
          <ProductImage path={product.logo_url} alt={`${product.name} logo`} fill sizes="36px" fallback={<LogoFallback name={product.name} />} />
        ) : (
          <LogoFallback name={product.name} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
        <p className="truncate text-xs text-muted-foreground">{product.tagline}</p>
      </div>
      {product.review_count > 0 && (
        <div className="flex shrink-0 items-center gap-1 text-xs font-medium text-foreground">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          {Number(product.avg_rating).toFixed(1)}
        </div>
      )}
    </Link>
  );
}

export function BuilderChip({ product }: { product: Product }) {
  const name = product.profile?.username ?? 'builder';
  return (
    <Link href={`/builders/${product.owner_id}`} className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        <AvatarFallback className="bg-muted text-[10px] font-semibold text-muted-foreground">
          {name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-xs text-muted-foreground hover:text-foreground">@{name}</span>
      {product.profile?.verified && <VerifiedBadge />}
    </Link>
  );
}

function LogoFallback({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand/20 to-brand/5 text-[10px] font-bold text-brand">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
