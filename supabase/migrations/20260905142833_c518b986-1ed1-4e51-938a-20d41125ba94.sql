CREATE TABLE public.cakto_checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  customer_name text NOT NULL CHECK (char_length(customer_name) BETWEEN 2 AND 120),
  customer_email text NOT NULL CHECK (char_length(customer_email) BETWEEN 5 AND 254),
  plan_id text NOT NULL CHECK (plan_id IN ('mensal', 'trimestral', 'anual')),
  plan_name text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  checkout_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refused', 'refunded')),
  cakto_transaction_id text,
  occurred_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.cakto_checkout_sessions TO service_role;

ALTER TABLE public.cakto_checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX cakto_checkout_sessions_email_status_idx
  ON public.cakto_checkout_sessions (lower(customer_email), status, created_at DESC);
CREATE INDEX cakto_checkout_sessions_transaction_idx
  ON public.cakto_checkout_sessions (cakto_transaction_id)
  WHERE cakto_transaction_id IS NOT NULL;

CREATE TRIGGER touch_cakto_checkout_sessions_updated_at
  BEFORE UPDATE ON public.cakto_checkout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();