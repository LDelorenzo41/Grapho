-- Palier 2a — Triage securite : fermer l'acces du role anon aux tables sensibles.
--
-- Contexte : les policies historiques etaient permissives pour {public}
-- (USING (true)), ce qui exposait au role anon (visiteur non connecte) les
-- donnees de sante, RGPD et la messagerie via l'API REST publique.
--
-- Correctif : on conserve une policy permissive identique (USING (true)) mais
-- restreinte au role authenticated. Comportement inchange pour les
-- utilisateurs connectes (client/admin) ; le role anon perd tout acces a ces
-- tables. Aucune logique de role/owner ici (pas de risque de recursion) :
-- l'isolation fine client-par-client est traitee au Palier 2b.
--
-- Aucune de ces tables n'est utilisee par le parcours public (reservation /
-- contact / banniere cookies), la fermeture anon est donc sans impact UI.
--
-- Migration idempotente : rejouable sans erreur.

-- prescriptions
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated full access prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Allow all on prescriptions" ON public.prescriptions;
CREATE POLICY "authenticated full access prescriptions" ON public.prescriptions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated full access sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow all on sessions" ON public.sessions;
CREATE POLICY "authenticated full access sessions" ON public.sessions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated full access messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all on messages" ON public.messages;
CREATE POLICY "authenticated full access messages" ON public.messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- consents
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated full access consents" ON public.consents;
DROP POLICY IF EXISTS "Allow all on consents" ON public.consents;
CREATE POLICY "authenticated full access consents" ON public.consents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated full access documents" ON public.documents;
DROP POLICY IF EXISTS "Allow all on documents" ON public.documents;
CREATE POLICY "authenticated full access documents" ON public.documents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
