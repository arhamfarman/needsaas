/*
# Revoke public execute on counter trigger functions

The vote-count and product-rating sync functions are SECURITY DEFINER trigger functions.
They only need to run when their triggers fire — they must NOT be callable via the REST API
(/rest/v1/rpc/...) by anon or authenticated roles. This revokes EXECUTE from public, anon,
and authenticated so the functions are trigger-only.
*/

REVOKE EXECUTE ON FUNCTION public.sync_need_vote_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_product_rating() FROM PUBLIC, anon, authenticated;
