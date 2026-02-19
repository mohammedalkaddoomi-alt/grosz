-- Backfill missing owner membership rows for existing wallets.
-- Run once in Supabase SQL Editor before enabling production traffic.

INSERT INTO public.wallet_members (wallet_id, user_id, role)
SELECT w.id, w.owner_id, 'owner'
FROM public.wallets w
LEFT JOIN public.wallet_members wm
  ON wm.wallet_id = w.id
 AND wm.user_id = w.owner_id
WHERE wm.id IS NULL;
