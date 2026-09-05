REVOKE ALL ON public.cakto_checkout_sessions FROM anon, authenticated;

CREATE POLICY "Checkout sessions are backend only"
ON public.cakto_checkout_sessions
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);