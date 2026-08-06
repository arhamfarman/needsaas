/*
# RLS policies for contributions and builder_interest
*/

-- contributions
DROP POLICY IF EXISTS "contributions_select_public" ON public.contributions;
CREATE POLICY "contributions_select_public" ON public.contributions
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "contributions_insert_own" ON public.contributions;
CREATE POLICY "contributions_insert_own" ON public.contributions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "contributions_update_own" ON public.contributions;
CREATE POLICY "contributions_update_own" ON public.contributions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "contributions_delete_own" ON public.contributions;
CREATE POLICY "contributions_delete_own" ON public.contributions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- builder_interest
DROP POLICY IF EXISTS "builder_interest_select_public" ON public.builder_interest;
CREATE POLICY "builder_interest_select_public" ON public.builder_interest
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "builder_interest_insert_own" ON public.builder_interest;
CREATE POLICY "builder_interest_insert_own" ON public.builder_interest
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = builder_id);

DROP POLICY IF EXISTS "builder_interest_update_own" ON public.builder_interest;
CREATE POLICY "builder_interest_update_own" ON public.builder_interest
  FOR UPDATE TO authenticated USING (auth.uid() = builder_id) WITH CHECK (auth.uid() = builder_id);

DROP POLICY IF EXISTS "builder_interest_delete_own" ON public.builder_interest;
CREATE POLICY "builder_interest_delete_own" ON public.builder_interest
  FOR DELETE TO authenticated USING (auth.uid() = builder_id);
