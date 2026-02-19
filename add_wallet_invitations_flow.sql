-- Shared wallet invitation request/accept flow
-- Run in Supabase SQL editor.

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

CREATE INDEX IF NOT EXISTS idx_wallet_invitations_wallet_id ON public.wallet_invitations(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_invitations_invitee_id ON public.wallet_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_wallet_invitations_status ON public.wallet_invitations(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_invitations_pending_unique
  ON public.wallet_invitations(wallet_id, invitee_id)
  WHERE status = 'pending';

ALTER TABLE public.wallet_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallet invitations" ON public.wallet_invitations;
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

DROP POLICY IF EXISTS "Owners can create wallet invitations" ON public.wallet_invitations;
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

DROP POLICY IF EXISTS "Invitee or inviter can update invitations" ON public.wallet_invitations;
CREATE POLICY "Invitee or inviter can update invitations"
  ON public.wallet_invitations FOR UPDATE
  USING (invitee_id = auth.uid() OR inviter_id = auth.uid())
  WITH CHECK (invitee_id = auth.uid() OR inviter_id = auth.uid());

DROP POLICY IF EXISTS "Invitee or inviter can delete invitations" ON public.wallet_invitations;
CREATE POLICY "Invitee or inviter can delete invitations"
  ON public.wallet_invitations FOR DELETE
  USING (invitee_id = auth.uid() OR inviter_id = auth.uid());

DROP TRIGGER IF EXISTS update_wallet_invitations_updated_at ON public.wallet_invitations;
CREATE TRIGGER update_wallet_invitations_updated_at BEFORE UPDATE ON public.wallet_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_invitations;
