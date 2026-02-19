-- =====================================================
-- Grosz Wallet App - Supabase Database Schema
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💰',
  is_shared BOOLEAN DEFAULT FALSE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet members table (for shared wallets)
CREATE TABLE IF NOT EXISTS public.wallet_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_id, user_id)
);

-- Wallet invitations table (request/accept flow for shared wallets)
CREATE TABLE IF NOT EXISTS public.wallet_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (inviter_id <> invitee_id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals table
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎯',
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(12, 2) DEFAULT 0 CHECK (current_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goal activities table (shared timeline for goal events)
CREATE TABLE IF NOT EXISTS public.goal_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'contributed')),
  amount NUMERIC(12, 2),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat history table (for AI assistant)
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings table (for wage calculator and other preferences)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  wage_amount NUMERIC(12, 2) NOT NULL CHECK (wage_amount > 0),
  wage_period TEXT NOT NULL CHECK (wage_period IN ('hourly', 'daily', 'weekly', 'monthly')),
  currency TEXT NOT NULL DEFAULT 'PLN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'PLN',
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_payment_date DATE NOT NULL,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  reminder_days_before INTEGER DEFAULT 1 CHECK (reminder_days_before >= 0),
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for better performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_wallets_owner_id ON public.wallets(owner_id);
CREATE INDEX IF NOT EXISTS idx_wallet_members_wallet_id ON public.wallet_members(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_members_user_id ON public.wallet_members(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_invitations_wallet_id ON public.wallet_invitations(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_invitations_invitee_id ON public.wallet_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_wallet_invitations_status ON public.wallet_invitations(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_invitations_pending_unique
  ON public.wallet_invitations(wallet_id, invitee_id)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_wallet_id ON public.goals(wallet_id);
CREATE INDEX IF NOT EXISTS idx_goal_activities_goal_id ON public.goal_activities(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_activities_user_id ON public.goal_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment_date ON public.subscriptions(next_payment_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can search other users (for invitations)
CREATE POLICY "Users can search other users"
  ON public.users FOR SELECT
  USING (true);

-- =====================================================
-- WALLETS POLICIES
-- =====================================================

-- Users can view wallets they own or are members of
CREATE POLICY "Users can view their wallets"
  ON public.wallets FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.wallet_members
      WHERE wallet_id = wallets.id AND user_id = auth.uid()
    )
  );

-- Users can create wallets
CREATE POLICY "Users can create wallets"
  ON public.wallets FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Only owners can update wallets
CREATE POLICY "Owners can update wallets"
  ON public.wallets FOR UPDATE
  USING (auth.uid() = owner_id);

-- Only owners can delete wallets
CREATE POLICY "Owners can delete wallets"
  ON public.wallets FOR DELETE
  USING (auth.uid() = owner_id);

-- =====================================================
-- WALLET MEMBERS POLICIES
-- =====================================================

-- Users can view members of wallets they belong to
CREATE POLICY "Users can view wallet members"
  ON public.wallet_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wallet_members wm
      WHERE wm.wallet_id = wallet_members.wallet_id AND wm.user_id = auth.uid()
    )
  );

-- Only wallet owners can add members
CREATE POLICY "Owners can add members"
  ON public.wallet_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wallets
      WHERE id = wallet_id AND owner_id = auth.uid()
    )
  );

-- Owners can remove members, or members can remove themselves
CREATE POLICY "Owners can remove members or users can leave"
  ON public.wallet_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.wallets
      WHERE id = wallet_id AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- WALLET INVITATIONS POLICIES
-- =====================================================

-- Users can view invitations they sent or received
CREATE POLICY "Users can view own wallet invitations"
  ON public.wallet_invitations FOR SELECT
  USING (
    inviter_id = auth.uid() OR
    invitee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.wallets
      WHERE id = wallet_invitations.wallet_id AND owner_id = auth.uid()
    )
  );

-- Only wallet owners can create invitations for their wallets
CREATE POLICY "Owners can create wallet invitations"
  ON public.wallet_invitations FOR INSERT
  WITH CHECK (
    inviter_id = auth.uid() AND
    status = 'pending' AND
    EXISTS (
      SELECT 1 FROM public.wallets
      WHERE id = wallet_id AND owner_id = auth.uid()
    )
  );

-- Invitee can accept/reject, inviter can cancel
CREATE POLICY "Invitee or inviter can update invitations"
  ON public.wallet_invitations FOR UPDATE
  USING (invitee_id = auth.uid() OR inviter_id = auth.uid())
  WITH CHECK (invitee_id = auth.uid() OR inviter_id = auth.uid());

-- Invitee or inviter can delete invitations
CREATE POLICY "Invitee or inviter can delete invitations"
  ON public.wallet_invitations FOR DELETE
  USING (invitee_id = auth.uid() OR inviter_id = auth.uid());

-- =====================================================
-- CATEGORIES POLICIES
-- =====================================================

-- Users can view system categories and their own custom categories
CREATE POLICY "Users can view categories"
  ON public.categories FOR SELECT
  USING (user_id IS NULL OR user_id = auth.uid());

-- Users can create custom categories
CREATE POLICY "Users can create categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own custom categories
CREATE POLICY "Users can delete own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRANSACTIONS POLICIES
-- =====================================================

-- Users can view transactions from wallets they have access to
CREATE POLICY "Users can view transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wallet_members
      WHERE wallet_id = transactions.wallet_id AND user_id = auth.uid()
    )
  );

-- Users can create transactions in wallets they're members of
CREATE POLICY "Members can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.wallet_members
      WHERE wallet_id = transactions.wallet_id AND user_id = auth.uid()
    )
  );

-- Users can delete their own transactions, or wallet owners can delete any
CREATE POLICY "Users can delete own transactions or owners can delete any"
  ON public.transactions FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.wallets
      WHERE id = transactions.wallet_id AND owner_id = auth.uid()
    )
  );

-- =====================================================
-- GOALS POLICIES
-- =====================================================

-- Users can only view their own goals
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

-- Users can create their own goals
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

-- Users can update their own goals
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

-- Users can delete their own goals
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

-- =====================================================
-- GOAL ACTIVITIES POLICIES
-- =====================================================

-- Users can view activities for goals they can access
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

-- Users can create activities only as themselves, for goals they can access
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

-- =====================================================
-- CHAT HISTORY POLICIES
-- =====================================================

-- Users can only view their own chat history
CREATE POLICY "Users can view own chat history"
  ON public.chat_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own chat history
CREATE POLICY "Users can create chat history"
  ON public.chat_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- USER SETTINGS POLICIES
-- =====================================================

-- Users can only view their own settings
CREATE POLICY "Users can view own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own settings
CREATE POLICY "Users can create settings"
  ON public.user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own settings
CREATE POLICY "Users can delete own settings"
  ON public.user_settings FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- SUBSCRIPTIONS POLICIES
-- =====================================================

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own subscriptions
CREATE POLICY "Users can create subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
  ON public.subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_invitations_updated_at BEFORE UPDATE ON public.wallet_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create a default personal wallet for new users
CREATE OR REPLACE FUNCTION create_default_wallet()
RETURNS TRIGGER AS $$
DECLARE
  new_wallet_id UUID;
BEGIN
  -- Create a personal wallet for the new user
  INSERT INTO public.wallets (name, emoji, is_shared, owner_id)
  VALUES ('Personal Wallet', '💰', FALSE, NEW.id)
  RETURNING id INTO new_wallet_id;

  -- Ensure owner can access wallet via wallet_members RLS policies
  INSERT INTO public.wallet_members (wallet_id, user_id, role)
  VALUES (new_wallet_id, NEW.id, 'owner')
  ON CONFLICT (wallet_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created ON public.users;

-- Trigger to create default wallet when a new user is created
CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION create_default_wallet();

-- =====================================================
-- SEED DATA - Default Categories
-- =====================================================

-- Income categories
INSERT INTO public.categories (name, emoji, type, user_id) VALUES
  ('Salary', '💰', 'income', NULL),
  ('Freelance', '💼', 'income', NULL),
  ('Investment', '📈', 'income', NULL),
  ('Gift', '🎁', 'income', NULL),
  ('Other Income', '💵', 'income', NULL)
ON CONFLICT DO NOTHING;

-- Expense categories
INSERT INTO public.categories (name, emoji, type, user_id) VALUES
  ('Food & Dining', '🍔', 'expense', NULL),
  ('Shopping', '🛍️', 'expense', NULL),
  ('Transportation', '🚗', 'expense', NULL),
  ('Bills & Utilities', '📱', 'expense', NULL),
  ('Entertainment', '🎬', 'expense', NULL),
  ('Healthcare', '🏥', 'expense', NULL),
  ('Education', '📚', 'expense', NULL),
  ('Travel', '✈️', 'expense', NULL),
  ('Groceries', '🛒', 'expense', NULL),
  ('Other Expense', '💸', 'expense', NULL)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ENABLE REALTIME
-- =====================================================

-- Enable realtime for tables that need it
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_invitations;
