export function JsonLd({ data }: { data: Record<string, any> | Record<string, any>[] }) {
  const json = JSON.stringify(data);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export function softwareJsonLd(product: {
  name: string;
  tagline: string;
  description: string;
  url: string | null;
  logo_url: string | null;
  pricing: string | null;
  price_from: string | null;
  repo_url: string | null;
  doc_url: string | null;
  category_name?: string | null;
  avg_rating: number;
  review_count: number;
  owner_username?: string | null;
  owner_verified?: boolean;
  canonicalUrl: string;
}) {
  const offers = product.pricing === 'Free' || product.pricing === 'Open Source'
    ? { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
    : product.price_from
      ? { '@type': 'Offer', price: product.price_from.replace(/[^0-9.]/g, '') || '0', priceCurrency: 'USD' }
      : { '@type': 'Offer', price: '0', priceCurrency: 'USD' };

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    description: product.tagline || product.description,
    applicationCategory: product.category_name || 'SoftwareApplication',
    ...(product.url && { url: product.url }),
    ...(product.logo_url && { image: product.logo_url }),
    ...(product.repo_url && { codeRepository: product.repo_url }),
    ...(product.doc_url && { documentationUrl: product.doc_url }),
    offers,
    ...(product.review_count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(product.avg_rating).toFixed(1),
        reviewCount: product.review_count,
      },
    }),
    author: {
      '@type': 'Person',
      name: product.owner_username || 'Unknown',
      ...(product.owner_verified && { identifier: 'Verified Builder' }),
    },
    url: product.canonicalUrl,
  };
}

export function needJsonLd(need: {
  title: string;
  description: string;
  category_name?: string | null;
  vote_count: number;
  reward_amount: number;
  need_score: number;
  status: string;
  canonicalUrl: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: need.title,
    text: need.description,
    ...(need.category_name && { about: need.category_name }),
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/LikeAction',
      userInteractionCount: need.vote_count,
    },
    ...(need.reward_amount > 0 && {
      offers: {
        '@type': 'Offer',
        price: String(need.reward_amount),
        priceCurrency: 'USD',
        description: 'Reward pool available for building this software',
      },
    }),
    status: need.status,
    url: need.canonicalUrl,
  };
}

export function builderJsonLd(builder: {
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  verified: boolean;
  product_count: number;
  canonicalUrl: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: builder.full_name || builder.username,
    alternateName: builder.username,
    ...(builder.bio && { description: builder.bio }),
    ...(builder.avatar_url && { image: builder.avatar_url }),
    ...(builder.verified && { identifier: 'Verified Builder' }),
    url: builder.canonicalUrl,
    knowsAbout: 'Software Development',
    jobTitle: 'Software Builder',
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'NeedSaaS',
    description: 'A marketplace where you find software to run your business, or post what you need and inspire someone to build it.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://needsaas.com'}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
