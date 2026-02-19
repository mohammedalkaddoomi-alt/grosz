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

  -- Ensure the owner is also a wallet member (required by RLS policies)
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
