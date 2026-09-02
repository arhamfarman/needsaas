'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { trackSearchEvent } from '@/lib/analytics';
import { ProductImage } from '@/components/product-image';
import { categoryIcon } from '@/lib/categories';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { VerifiedBadge } from '@/components/verified-badge';
import { Search as SearchIcon, Lightbulb, Package, ArrowRight, X, Sparkles, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AutocompleteResult } from '@/lib/types';

const PLACEHOLDER_EXAMPLES = [
  "automate invoices",
  "manage my physiotherapy clinic",
  "run my restaurant",
  "manage construction projects",
  "automate payroll",
];

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query) return;
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const searchAll = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);

    const { data, error } = await supabase.rpc('search_autocomplete', {
      search_term: q.trim(),
      limit_count: 10,
    });

    if (error) {
      console.error('Search error:', error);
    }

    setSuggestions((data as AutocompleteResult[]) ?? []);
    setLoading(false);
  }, []);

  function onQueryChange(value: string) {
    setQuery(value);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchAll(value), 150);
  }

  function goToSearch() {
    if (query.trim()) {
      trackSearchEvent(query, suggestions.length);
      if (hasSearched && suggestions.length === 0) {
        router.push(`/dashboard?tab=needs&title=${encodeURIComponent(query.trim())}#post-a-need`);
      } else {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    } else {
      router.push('/search');
    }
    setFocused(false);
  }

  function navigateTo(index: number) {
    const item = suggestions[index];
    if (item) {
      trackSearchEvent(query, suggestions.length, item.result_type, item.result_id);
      router.push(item.href);
      setFocused(false);
    }
  }

  function onKeydown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        navigateTo(activeIndex);
      } else if (suggestions.length > 0) {
        navigateTo(0);
      } else {
        goToSearch();
      }
    } else if (e.key === 'Escape') {
      setFocused(false);
      setActiveIndex(-1);
      (e.target as HTMLInputElement).blur();
    }
  }

  const showDropdown = focused && query.length >= 2;
  const hasResults = suggestions.length > 0;

  const products = suggestions.filter((s) => s.result_type === 'product');
  const needs = suggestions.filter((s) => s.result_type === 'need');
  const builders = suggestions.filter((s) => s.result_type === 'builder');
  const categories = suggestions.filter((s) => s.result_type === 'category');

  let flatIndex = -1;
  function nextIndex() {
    flatIndex++;
    return flatIndex;
  }

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-2xl">
      <div
        className={cn(
          'group relative flex items-center gap-2 rounded-2xl border bg-card/80 backdrop-blur-xl transition-all duration-300',
          focused
            ? 'border-brand/30 shadow-soft-xl ring-4 ring-brand/5'
            : 'border-border/50 shadow-soft-lg hover:border-border/80'
        )}
      >
        <SearchIcon className={cn(
          'pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors',
          focused ? 'text-brand' : 'text-muted-foreground'
        )} />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeydown}
          className="h-16 w-full rounded-2xl bg-transparent pl-14 pr-28 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:text-lg"
          placeholder={query ? "I'm looking for software to..." : `I'm looking for software to ${PLACEHOLDER_EXAMPLES[placeholderIdx]}...`}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
        />
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
          {query && (
            <button
              onClick={() => { setQuery(''); setSuggestions([]); setHasSearched(false); setActiveIndex(-1); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={goToSearch}
            className="hidden h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-soft transition hover:bg-brand/90 sm:flex"
          >
            Search
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {showDropdown && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-border/50 bg-card/95 shadow-soft-xl backdrop-blur-xl"
        >
          {loading ? (
            <div className="flex items-center gap-3 px-5 py-8 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-brand" />
              Searching across software, needs, builders, and categories...
            </div>
          ) : hasResults ? (
            <div className="max-h-[480px] overflow-y-auto py-2">
              {products.length > 0 && (
                <SuggestionGroup label="Software" icon={Package}>
                  {products.map((s) => {
                    const idx = nextIndex();
                    return (
                      <SuggestionItem
                        key={`p-${s.result_id}`}
                        item={s}
                        index={idx}
                        activeIndex={activeIndex}
                        onNavigate={() => navigateTo(idx)}
                        onHover={() => setActiveIndex(idx)}
                      />
                    );
                  })}
                </SuggestionGroup>
              )}
              {needs.length > 0 && (
                <SuggestionGroup label="Needs" icon={Lightbulb}>
                  {needs.map((s) => {
                    const idx = nextIndex();
                    return (
                      <SuggestionItem
                        key={`n-${s.result_id}`}
                        item={s}
                        index={idx}
                        activeIndex={activeIndex}
                        onNavigate={() => navigateTo(idx)}
                        onHover={() => setActiveIndex(idx)}
                      />
                    );
                  })}
                </SuggestionGroup>
              )}
              {builders.length > 0 && (
                <SuggestionGroup label="Builders" icon={Users}>
                  {builders.map((s) => {
                    const idx = nextIndex();
                    return (
                      <SuggestionItem
                        key={`b-${s.result_id}`}
                        item={s}
                        index={idx}
                        activeIndex={activeIndex}
                        onNavigate={() => navigateTo(idx)}
                        onHover={() => setActiveIndex(idx)}
                      />
                    );
                  })}
                </SuggestionGroup>
              )}
              {categories.length > 0 && (
                <SuggestionGroup label="Categories" icon={SearchIcon}>
                  {categories.map((s) => {
                    const idx = nextIndex();
                    return (
                      <SuggestionItem
                        key={`c-${s.result_id}`}
                        item={s}
                        index={idx}
                        activeIndex={activeIndex}
                        onNavigate={() => navigateTo(idx)}
                        onHover={() => setActiveIndex(idx)}
                      />
                    );
                  })}
                </SuggestionGroup>
              )}

              <div className="border-t border-border/40 px-3 py-2">
                <Link
                  href={query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search'}
                  onClick={() => {
                    trackSearchEvent(query, suggestions.length);
                    setFocused(false);
                  }}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-brand transition hover:bg-brand/5"
                >
                  See all results for &ldquo;{query.trim()}&rdquo;
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            hasSearched && !loading && (
              <div className="px-6 py-8 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <p className="font-display text-sm font-semibold text-foreground">
                  We couldn&apos;t find software matching your search.
                </p>
                <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  Post your Need for free and inspire someone to build it.
                </p>
                <Link
                  href="/dashboard?tab=needs"
                  onClick={() => setFocused(false)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-soft transition hover:bg-brand/90"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Post your need — it&apos;s free
                </Link>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionGroup({ label, icon: Icon, children }: { label: string; icon: typeof Package; children: React.ReactNode }) {
  return (
    <div className="px-2">
      <div className="flex items-center gap-1.5 px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        <Icon className="h-3 w-3" /> {label}
      </div>
      {children}
    </div>
  );
}

function SuggestionItem({
  item,
  index,
  activeIndex,
  onNavigate,
  onHover,
}: {
  item: AutocompleteResult;
  index: number;
  activeIndex: number;
  onNavigate: () => void;
  onHover: () => void;
}) {
  const isActive = index === activeIndex;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      onMouseEnter={onHover}
      role="option"
      aria-selected={isActive}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 transition',
        isActive ? 'bg-brand/10' : 'hover:bg-accent/50'
      )}
    >
      {item.result_type === 'product' && (
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-muted">
          {item.image_url ? (
            <ProductImage path={item.image_url} alt={item.title} fill sizes="32px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/20 to-brand/5 text-[10px] font-bold text-brand">
              {item.title.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      )}
      {item.result_type === 'need' && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Lightbulb className="h-4 w-4" />
        </div>
      )}
      {item.result_type === 'builder' && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-muted text-[10px] font-semibold text-muted-foreground">
            {item.title.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      {item.result_type === 'category' && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {(() => { const Ic = categoryIcon(null); return <Ic className="h-4 w-4" />; })()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
        {item.subtitle && <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>}
      </div>
      <ArrowRight className={cn('h-3.5 w-3.5 shrink-0 transition', isActive ? 'text-brand' : 'text-muted-foreground/50')} />
    </Link>
  );
}
