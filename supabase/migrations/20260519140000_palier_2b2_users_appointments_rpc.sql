-- Palier 2b-2 — Refonte RLS : users + appointments via RPC SECURITY DEFINER.
--
-- Pre-requis : Paliers 2a et 2b-1 appliques ; code applicatif (commit
-- "Palier 2b-2 (code)") deploye en prod (BookingCalendar / SupabaseAdapter
-- utilisent email_exists() et get_busy_slots() au lieu d'un acces anon
-- direct a users / appointments).
--
-- 1. RPC :
--    - email_exists(email)  : test d'existence pour la reservation, sans
--      exposer l'annuaire users au role anon.
--    - get_busy_slots()     : plages horaires occupees (sans client_id ni
--      notes) pour le calcul des creneaux cote client.
-- 2. Fermeture de l'acces anon en lecture directe a users / appointments,
--    isolation par utilisateur, et remplacement des policies admin
--    recursives (sous-SELECT sur users) par public.is_admin().
--
-- Migration idempotente : rejouable sans erreur.

-- ---------------------------------------------------------------------------
-- RPC
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.email_exists(p_email text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE email = p_email);
$$;
REVOKE ALL ON FUNCTION public.email_exists(text) FROM public;
GRANT EXECUTE ON FUNCTION public.email_exists(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_busy_slots()
RETURNS TABLE (start_time timestamptz, end_time timestamptz, status text)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = ''
AS $$
  SELECT a.start_time, a.end_time, a.status::text
  FROM public.appointments a;
$$;
REVOKE ALL ON FUNCTION public.get_busy_slots() FROM public;
GRANT EXECUTE ON FUNCTION public.get_busy_slots() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow read access to users"    ON public.users;
DROP POLICY IF EXISTS "Allow insert for registration" ON public.users;
DROP POLICY IF EXISTS "Allow update own profile"      ON public.users;
DROP POLICY IF EXISTS "Admins can update all users"   ON public.users;
DROP POLICY IF EXISTS "Admins can delete users"       ON public.users;
DROP POLICY IF EXISTS "users select" ON public.users;
DROP POLICY IF EXISTS "users insert" ON public.users;
DROP POLICY IF EXISTS "users update" ON public.users;
DROP POLICY IF EXISTS "users delete" ON public.users;

CREATE POLICY "users select" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "users insert" ON public.users
  FOR INSERT TO anon, authenticated
  WITH CHECK (role = 'client' OR public.is_admin());

CREATE POLICY "users update" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "users delete" ON public.users
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow read appointments"        ON public.appointments;
DROP POLICY IF EXISTS "Allow create appointments"      ON public.appointments;
DROP POLICY IF EXISTS "Allow update appointments"      ON public.appointments;
DROP POLICY IF EXISTS "Allow delete appointments"      ON public.appointments;
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;
DROP POLICY IF EXISTS "appointments select" ON public.appointments;
DROP POLICY IF EXISTS "appointments insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments update" ON public.appointments;
DROP POLICY IF EXISTS "appointments delete" ON public.appointments;

CREATE POLICY "appointments select" ON public.appointments
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR public.is_admin());

CREATE POLICY "appointments insert" ON public.appointments
  FOR INSERT TO anon, authenticated
  WITH CHECK (public.is_admin() OR status = 'scheduled');

CREATE POLICY "appointments update" ON public.appointments
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "appointments delete" ON public.appointments
  FOR DELETE TO authenticated
  USING (public.is_admin());
