ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_from text;

REVOKE UPDATE ON public.products FROM authenticated;
GRANT UPDATE (
  name, tagline, description, url, repo_url, pricing, price_from, logo_url, images,
  category_id, updated_at
) ON public.products TO authenticated;
