-- Goal activities timeline for personal/shared goals.
-- Run in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.goal_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'contributed')),
  amount NUMERIC(12, 2),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goal_activities_goal_id ON public.goal_activities(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_activities_user_id ON public.goal_activities(user_id);

ALTER TABLE public.goal_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view goal activities" ON public.goal_activities;
CREATE POLICY "Users can view goal activities"
  ON public.goal_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.goals
      WHERE goals.id = goal_activities.goal_id
        AND (
          goals.user_id = auth.uid()
          OR (
            goals.wallet_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.wallet_members
              WHERE wallet_members.wallet_id = goals.wallet_id
                AND wallet_members.user_id = auth.uid()
            )
          )
        )
    )
  );

DROP POLICY IF EXISTS "Users can create goal activities" ON public.goal_activities;
CREATE POLICY "Users can create goal activities"
  ON public.goal_activities FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.goals
      WHERE goals.id = goal_activities.goal_id
        AND (
          goals.user_id = auth.uid()
          OR (
            goals.wallet_id IS NOT NULL
            AND EXISTS (
              SELECT 1 FROM public.wallet_members
              WHERE wallet_members.wallet_id = goals.wallet_id
                AND wallet_members.user_id = auth.uid()
            )
          )
        )
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_activities;
