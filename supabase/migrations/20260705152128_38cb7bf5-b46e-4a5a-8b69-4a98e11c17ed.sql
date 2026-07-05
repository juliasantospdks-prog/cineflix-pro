
-- Fix mutable search_path on touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

-- Restrict EXECUTE on SECURITY DEFINER / helper functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- Remove anon read access from admin-only / sensitive tables (fixes GraphQL anon exposure)
REVOKE SELECT ON public.cakto_sales FROM anon;
REVOKE SELECT ON public.sales FROM anon;
REVOKE SELECT ON public.company_receipts FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;
