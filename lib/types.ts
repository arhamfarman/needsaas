export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  seo_title: string | null;
  seo_description: string | null;
  long_description: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  website: string | null;
  twitter: string | null;
  github: string | null;
  location: string | null;
  verified: boolean;
  pro_builder: boolean;
  pro_builder_since: string | null;
  pro_builder_until: string | null;
  is_admin: boolean;
  linkedin: string | null;
  country: string | null;
  builder_onboarded: boolean;
  created_at: string;
  updated_at: string;
};

export type BlogTag = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type NeedStatus = 'open' | 'committed' | 'building' | 'fulfilled' | 'closed';
export type Timeline = '30_days' | '60_days' | '90_days' | 'flexible' | null;
export type NeedScoreTrend = 'rising' | 'falling' | 'stable';

export type Need = {
  id: string;
  title: string;
  description: string;
  category_id: string | null;
  owner_id: string;
  status: NeedStatus;
  vote_count: number;
  reward_amount: number;
  contributor_count: number;
  timeline: Timeline;
  reward_note: string | null;
  builder_committed_id: string | null;
  committed_at: string | null;
  progress: number;
  bookmark_count: number;
  need_score: number;
  need_score_trend: NeedScoreTrend;
  need_score_updated_at: string | null;
  pinned: boolean;
  featured_need: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  profile?: Profile | null;
  has_voted?: boolean;
  interested_builders?: number;
};

export type Product = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string | null;
  repo_url: string | null;
  doc_url: string | null;
  pricing: string | null;
  price_from: string | null;
  logo_url: string | null;
  images: string[];
  paid: boolean;
  paid_at: string | null;
  featured: boolean;
  view_count: number;
  bookmark_count: number;
  category_id: string | null;
  owner_id: string;
  review_count: number;
  avg_rating: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  profile?: Profile | null;
  tags?: Tag[];
};

export type Contribution = {
  id: string;
  need_id: string;
  user_id: string;
  amount: number;
  note: string | null;
  created_at: string;
  profile?: Profile | null;
};

export type BuilderInterest = {
  id: string;
  need_id: string;
  builder_id: string;
  type: 'interested' | 'committed';
  created_at: string;
  profile?: Profile | null;
};

export type NeedProductLink = {
  id: string;
  need_id: string;
  product_id: string;
  owner_id: string;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  product?: Product | null;
  need?: Need | null;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  reported: boolean;
  created_at: string;
  updated_at: string;
  profile?: Profile | null;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Bookmark = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};

export type PageView = {
  id: string;
  entity_type: 'product' | 'builder' | 'need';
  entity_id: string;
  visitor_id: string | null;
  user_id: string | null;
  referrer: string | null;
  created_at: string;
};

export type SearchEvent = {
  id: string;
  query: string;
  result_count: number;
  clicked_type: string | null;
  clicked_id: string | null;
  user_id: string | null;
  visitor_id: string | null;
  created_at: string;
};

export type ActivityFeedItem = {
  id: string;
  user_id: string;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
};

export type BuilderVerification = {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  website_url: string | null;
  github_url: string | null;
  twitter_url: string | null;
  portfolio_url: string | null;
  notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
};

export type NeedMatch = {
  id: string;
  product_id: string;
  need_id: string;
  match_score: number;
  match_reasons: string | null;
  status: 'suggested' | 'attached' | 'dismissed';
  created_at: string;
  need?: Need | null;
  product?: Product | null;
};

export type SearchResult = {
  result_type: 'product' | 'need' | 'builder' | 'category';
  result_id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  href: string;
  rank: number;
  is_featured: boolean;
  is_verified: boolean;
};

export type AutocompleteResult = {
  result_type: 'product' | 'need' | 'builder' | 'category';
  result_id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  href: string;
  rank: number;
};

export type BuilderAnalytics = {
  total_views: number;
  unique_visitors: number;
  profile_views: number;
  bookmarks: number;
  reviews: number;
  product_clicks: number;
  need_matches: number;
  avg_rating: number;
  product_count: number;
};

export type OpportunityFeedItem = {
  need_id: string;
  title: string;
  description: string;
  category_id: string | null;
  category_name: string | null;
  category_slug: string | null;
  vote_count: number;
  reward_amount: number;
  contributor_count: number;
  need_score: number;
  need_score_trend: NeedScoreTrend;
  status: NeedStatus;
  builder_interest_count: number;
  growth_rate: number;
  competition_level: "None" | "Low" | "Medium" | "High";
  competing_products: number;
  match_score: number;
  match_reasons: string | null;
  created_at: string;
};


export type StarterPack = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  cover_image_url: string | null;
  industry: string | null;
  published: boolean;
  featured: boolean;
  sort_order: number;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type StarterPackProduct = {
  id: string;
  starter_pack_id: string;
  product_id: string;
  sort_order: number;
  featured: boolean;
  blurb: string | null;
  role_label: string | null;
  best_for_label: string | null;
  pricing_label: string | null;
  product?: Product;
};

export type StarterPackFaq = {
  id: string;
  starter_pack_id: string;
  question: string;
  answer: string;
  sort_order: number;
};

export type StarterPackBlogPost = {
  id: string;
  starter_pack_id: string;
  blog_post_id: string;
  sort_order: number;
  blog_post?: BlogPost;
};

export type StarterPackNeed = {
  id: string;
  starter_pack_id: string;
  need_id: string;
  sort_order: number;
  need?: Need;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_image_url: string | null;
  published: boolean;
  status: 'draft' | 'scheduled' | 'published';
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

export type StarterPackCategory = {
  id: string;
  starter_pack_id: string;
  category_id: string;
  category?: Category;
};
