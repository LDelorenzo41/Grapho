-- Palier 2b-1 — Isolation client-par-client (refonte RLS).
--
-- Pre-requis : Palier 2a applique (acces anon ferme sur les tables sensibles).
--
-- 1. Fonction is_admin() en SECURITY DEFINER : determine si l'appelant est
--    admin sans declencher de recursion RLS sur la table users (la fonction
--    s'execute avec les droits du proprietaire, qui contourne RLS).
-- 2. Remplacement des policies permissives "authenticated USING(true)" du
--    Palier 2a par une vraie isolation : un client n'accede qu'a ses propres
--    lignes ; l'admin a un acces complet ; les ecritures de donnees de suivi
--    (sessions/prescriptions) sont reservees a l'admin.
--
-- Mapping colonnes (schema reel, snake_case) :
--   prescriptions.client_id, sessions.client_id, consents.user_id,
--   messages.sender_id/recipient_id,
--   documents.user_id/uploaded_by/visibility/visible_to_user_ids.
-- users.id = auth.uid() (garanti par le flux d'auth applicatif).
--
-- Migration idempotente : rejouable sans erreur.

-- ---------------------------------------------------------------------------
-- Fonction is_admin()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- prescriptions
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "authenticated full access prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions select" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions insert" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions update" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions delete" ON public.prescriptions;

CREATE POLICY "prescriptions select" ON public.prescriptions
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR public.is_admin());
CREATE POLICY "prescriptions insert" ON public.prescriptions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "prescriptions update" ON public.prescriptions
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "prescriptions delete" ON public.prescriptions
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- consents
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "authenticated full access consents" ON public.consents;
DROP POLICY IF EXISTS "consents select" ON public.consents;
DROP POLICY IF EXISTS "consents insert" ON public.consents;
DROP POLICY IF EXISTS "consents update" ON public.consents;
DROP POLICY IF EXISTS "consents delete" ON public.consents;

CREATE POLICY "consents select" ON public.consents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "consents insert" ON public.consents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "consents update" ON public.consents
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "consents delete" ON public.consents
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- sessions
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "authenticated full access sessions" ON public.sessions;
DROP POLICY IF EXISTS "sessions select" ON public.sessions;
DROP POLICY IF EXISTS "sessions insert" ON public.sessions;
DROP POLICY IF EXISTS "sessions update" ON public.sessions;
DROP POLICY IF EXISTS "sessions delete" ON public.sessions;

CREATE POLICY "sessions select" ON public.sessions
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR public.is_admin());
CREATE POLICY "sessions insert" ON public.sessions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "sessions update" ON public.sessions
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "sessions delete" ON public.sessions
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "authenticated full access messages" ON public.messages;
DROP POLICY IF EXISTS "messages select" ON public.messages;
DROP POLICY IF EXISTS "messages insert" ON public.messages;
DROP POLICY IF EXISTS "messages update" ON public.messages;
DROP POLICY IF EXISTS "messages delete" ON public.messages;

CREATE POLICY "messages select" ON public.messages
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid() OR public.is_admin());
CREATE POLICY "messages insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() OR public.is_admin());
CREATE POLICY "messages update" ON public.messages
  FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid() OR public.is_admin())
  WITH CHECK (recipient_id = auth.uid() OR public.is_admin());
CREATE POLICY "messages delete" ON public.messages
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "authenticated full access documents" ON public.documents;
DROP POLICY IF EXISTS "documents select" ON public.documents;
DROP POLICY IF EXISTS "documents insert" ON public.documents;
DROP POLICY IF EXISTS "documents update" ON public.documents;
DROP POLICY IF EXISTS "documents delete" ON public.documents;

CREATE POLICY "documents select" ON public.documents
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR user_id = auth.uid()
    OR uploaded_by = auth.uid()
    OR visibility = 'all'
    OR visibility = 'clients'
    OR (visibility = 'specific' AND auth.uid() = ANY (visible_to_user_ids))
  );
CREATE POLICY "documents insert" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() OR public.is_admin());
CREATE POLICY "documents update" ON public.documents
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "documents delete" ON public.documents
  FOR DELETE TO authenticated
  USING (public.is_admin());
