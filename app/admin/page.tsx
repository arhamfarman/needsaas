import { supabase } from '@/lib/supabase';
import { AdminOverview } from '@/components/admin-overview';

export const metadata = { title: 'Dashboard' };

export default async function AdminDashboardPage() {
  // Gather stats
  const [users, products, needs, reviews, blogPosts, starterPacks] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('paid', true),
    supabase.from('needs').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
    supabase.from('starter_packs').select('*', { count: 'exact', head: true }),
  ]);

  // Pending items
  const [pendingProducts, openNeeds, reportedReviews, draftPosts] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('paid', false),
    supabase.from('needs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('reported', true),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
  ]);

  // Pro builders
  const { count: proBuilders } = await supabase
    .from('profiles').select('*', { count: 'exact', head: true }).eq('pro_builder', true);

  // Total reward pool
  const { data: rewardData } = await supabase
    .from('needs').select('reward_amount').gt('reward_amount', 0);
  const totalRewards = (rewardData ?? []).reduce((sum, r) => sum + Number(r.reward_amount), 0);

  return (
    <AdminOverview
      stats={{
        users: users.count ?? 0,
        products: products.count ?? 0,
        needs: needs.count ?? 0,
        reviews: reviews.count ?? 0,
        blogPosts: blogPosts.count ?? 0,
        starterPacks: starterPacks.count ?? 0,
        proBuilders: proBuilders ?? 0,
        totalRewards,
        pendingProducts: pendingProducts.count ?? 0,
        openNeeds: openNeeds.count ?? 0,
        reportedReviews: reportedReviews.count ?? 0,
        draftPosts: draftPosts.count ?? 0,
      }}
    />
  );
}
