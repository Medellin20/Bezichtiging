-- Independent payment visibility controls; preserve existing payment details.
ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS show_rib boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_payment_link boolean NOT NULL DEFAULT true;
