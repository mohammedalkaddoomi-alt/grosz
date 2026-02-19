-- Joint goals support: scope goals to wallet (shared or personal)
-- Run in Supabase SQL editor.

ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_goals_wallet_id ON public.goals(wallet_id);

DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;
CREATE POLICY "Users can view own goals"
  ON public.goals FOR SELECT
  USING (
    auth.uid() = user_id OR
    (
      wallet_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.wallet_members
        WHERE wallet_id = goals.wallet_id AND user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can create goals" ON public.goals;
CREATE POLICY "Users can create goals"
  ON public.goals FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    (
      wallet_id IS NULL OR
      EXISTS (
        SELECT 1 FROM public.wallet_members
        WHERE wallet_id = goals.wallet_id AND user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users can update own goals"
  ON public.goals FOR UPDATE
  USING (
    auth.uid() = user_id OR
    (
      wallet_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.wallet_members
        WHERE wallet_id = goals.wallet_id AND user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id OR
    (
      wallet_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.wallet_members
        WHERE wallet_id = goals.wallet_id AND user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
CREATE POLICY "Users can delete own goals"
  ON public.goals FOR DELETE
  USING (
    auth.uid() = user_id OR
    (
      wallet_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM public.wallet_members
        WHERE wallet_id = goals.wallet_id AND user_id = auth.uid()
      )
    )
  );
