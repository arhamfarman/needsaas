export function JsonLd({ data }: { data: Record<string, any> | Record<string, any>[] }) {
  // Need/product titles and descriptions are user-generated and flow into this
  // JSON straight from the DB (see needJsonLd/softwareJsonLd below). Escaping
  // `<` prevents a value containing a literal `</script>` from breaking out of
  // this tag and injecting arbitrary markup/script into the page.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
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
  description: string | null;
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
  key_features?: string[] | null;
  target_audience?: string | null;
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
    // Description first, tagline as the fallback -- description is now
    // optional at submission, tagline never is.
    description: product.description || product.tagline,
    applicationCategory: product.category_name || 'SoftwareApplication',
    ...(product.url && { url: product.url }),
    ...(product.logo_url && { image: product.logo_url }),
    ...(product.repo_url && { codeRepository: product.repo_url }),
    ...(product.doc_url && { documentationUrl: product.doc_url }),
    ...(product.key_features && product.key_features.length > 0 && { featureList: product.key_features.join(', ') }),
    ...(product.target_audience && { audience: { '@type': 'Audience', audienceType: product.target_audience } }),
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
  who_for?: string | null;
  industry?: string | null;
  solution_type?: string | null;
  desired_outcome?: string | null;
}) {
  const additionalProperty: Record<string, any>[] = [];
  if (need.industry) additionalProperty.push({ '@type': 'PropertyValue', name: 'Industry', value: need.industry });
  if (need.solution_type) additionalProperty.push({ '@type': 'PropertyValue', name: 'Possible solution type', value: need.solution_type });
  if (need.who_for) additionalProperty.push({ '@type': 'PropertyValue', name: 'Who this is for', value: need.who_for });
  if (need.reward_amount > 0) {
    // Deliberately NOT an `Offer` -- pledges are a non-binding demand
    // signal, not money anyone can pay to receive, so a schema.org Offer
    // (which implies a real commercial transaction) would be misleading to
    // both search engines and AI systems reading this page.
    additionalProperty.push({
      '@type': 'PropertyValue',
      name: 'Pledged (non-binding, not currently charged)',
      value: `$${need.reward_amount}`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: need.title,
    text: need.description,
    ...(need.category_name && { about: need.category_name }),
    ...(need.desired_outcome && { abstract: need.desired_outcome }),
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/LikeAction',
      userInteractionCount: need.vote_count,
    },
    ...(additionalProperty.length > 0 && { additionalProperty }),
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

export function blogPostJsonLd(post: {
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  updated_at: string | null;
  author_name: string | null;
  canonicalUrl: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    ...(post.excerpt && { description: post.excerpt }),
    ...(post.cover_image_url && { image: post.cover_image_url }),
    ...(post.published_at && { datePublished: post.published_at }),
    ...(post.updated_at && { dateModified: post.updated_at }),
    author: {
      '@type': 'Person',
      name: post.author_name || 'NeedSaaS',
    },
    publisher: {
      '@type': 'Organization',
      name: 'NeedSaaS',
    },
    mainEntityOfPage: post.canonicalUrl,
    url: post.canonicalUrl,
  };
}

export function starterPackJsonLd(pack: {
  title: string;
  description: string | null;
  industry: string | null;
  canonicalUrl: string;
  products: { name: string | null; tagline: string | null }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pack.title,
    ...(pack.description && { description: pack.description }),
    url: pack.canonicalUrl,
    ...(pack.industry && { about: pack.industry }),
    ...(pack.products.length > 0 && {
      hasPart: pack.products.map((p) => ({
        '@type': 'SoftwareApplication',
        ...(p.name && { name: p.name }),
        ...(p.tagline && { description: p.tagline }),
      })),
    }),
  };
}

export function faqPageJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

export function starterPackListJsonLd(packs: { title: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: packs.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.title,
      url: p.url,
    })),
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
