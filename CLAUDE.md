# CLAUDE.md

Consignes pour Claude sur ce dépôt : site vitrine + espaces client et admin d'une
graphothérapeute (React/Vite hébergé sur Netlify ; Supabase pour la base de
données, l'authentification, le stockage de fichiers et les edge functions).

## Supabase : toute nouvelle table doit recevoir ses droits d'accès

### Pourquoi

À partir du **30 octobre 2026**, Supabase ne donne plus automatiquement accès aux
**nouvelles** tables du schéma `public` (ni à leurs séquences) via l'API
(supabase-js, PostgREST, GraphQL). Sans `GRANT` explicite, l'API répond
`permission denied` (code `42501`), **même si la RLS est correcte**.

- La clé `service_role` contourne la RLS, **pas les GRANT** : une edge function
  échoue elle aussi sur une table sans GRANT.
- Les tables existantes gardent leurs droits. Mais supprimer puis recréer une
  table (`DROP` + `CREATE`) en fait une nouvelle table, qui perd ses droits.
- Les fonctions et les vues ne sont pas concernées.
- Un projet Supabase créé après le 30 mai 2026 applique déjà cette règle.
- Jusqu'au 30 octobre 2026, ce projet donne encore **tous** les droits à tous
  les rôles (`anon` compris) sur chaque nouvelle table. Le `REVOKE ALL` du
  modèle ci-dessous rend le résultat identique avant et après l'échéance.

### Règle obligatoire

Toute création de table dans `public` passe par une migration
`supabase/migrations/AAAAMMJJHHMMSS_description.sql`, rejouable sans erreur
(`IF NOT EXISTS`, `DROP POLICY IF EXISTS`), qui contient, **dans le même
fichier** que le `CREATE TABLE` :

1. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
2. les policies : une par opération utile, rôle nommé avec `TO`, admin reconnu
   par `public.is_admin()` (pas de sous-requête sur `users` : risque de
   récursion RLS) ;
3. `REVOKE ALL ... FROM anon, authenticated, service_role;` puis des `GRANT`
   explicites pour `anon`, `authenticated` et `service_role`, **limités à ce
   dont chaque rôle a besoin** (voir « Rôles réels de ce projet ») ;
4. si une colonne `serial`, `bigserial` ou `identity` crée une séquence :
   `GRANT USAGE, SELECT ON SEQUENCE ...` pour chaque rôle qui ajoute des lignes.
   Convention du projet : `id uuid DEFAULT gen_random_uuid()`, donc aucune
   séquence.

Après exécution en production : lancer la requête de vérification (plus bas),
puis mettre à jour le tableau « Usage actuel des tables ».

Interdits :

- donner à `anon` un droit sur des données personnelles ou de santé, ou un
  droit `UPDATE` / `DELETE` sur quelque table que ce soit ;
- contourner la règle avec `ALTER DEFAULT PRIVILEGES ... GRANT ... TO anon` :
  cela rouvrirait toutes les futures tables aux visiteurs ;
- utiliser la clé `service_role` dans `src/` (code exécuté dans le navigateur) :
  elle reste dans `supabase/functions/` ;
- créer ou modifier une table à la main dans le tableau de bord Supabase sans
  reporter le script dans `supabase/migrations/` (la production s'est déjà
  écartée des scripts du dépôt).

### Rôles réels de ce projet

| Rôle | Qui | Où |
|---|---|---|
| `anon` | visiteur non connecté | pages publiques (accueil, méthode, tarifs, FAQ, contact, mentions légales, confidentialité, connexion). Seule la page **contact** touche la base : réservation en ligne (`src/components/BookingCalendar.tsx`) |
| `authenticated` | client connecté (`/client/*`) et praticienne admin (`/admin/*`) | `src/lib/data/supa/SupabaseAdapter.ts` (clé anon + session) ; l'admin est reconnu par `public.is_admin()` |
| `service_role` | code serveur uniquement | edge functions `delete-user-admin` (lit et supprime dans `users`) et `ping` (compte les lignes de `users`) ; `send-email` ne touche pas la base. Aucune tâche planifiée ni traitement IA dans le dépôt. |

Usage actuel des tables (toutes créées avant l'échéance : elles gardent leurs
droits) :

| Table | `anon` | `authenticated` | `service_role` |
|---|---|---|---|
| `users` | ajout (compte créé à la 1re réservation) ; test d'e-mail via la RPC `email_exists` | client : son profil ; admin : tout | `delete-user-admin`, `ping` |
| `appointments` | ajout (réservation) ; créneaux occupés via la RPC `get_busy_slots` | client : ses RDV ; admin : tout | — |
| `availability_rules` | lecture (calendrier de réservation) | admin : gestion des horaires | — |
| `settings` | — | admin : lecture | — |
| `documents`, `messages`, `consents`, `sessions`, `prescriptions` | — (données personnelles / de santé) | client : ses lignes ; admin : tout (`prescriptions` pas encore utilisée par l'interface) | — |

Par défaut, une nouvelle table est **privée** : aucun droit pour `anon`. Pour
montrer une information au public, préférer une fonction `SECURITY DEFINER` qui
ne renvoie que le strict nécessaire (modèles : `get_busy_slots`, `email_exists`
dans `supabase/migrations/*_palier_2b2_*`) plutôt qu'ouvrir la table à `anon`.

### Modèle à copier (table privée : cas par défaut)

```sql
-- 1. Table (identifiant uuid : pas de séquence)
CREATE TABLE IF NOT EXISTS public.ma_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. RLS
ALTER TABLE public.ma_table ENABLE ROW LEVEL SECURITY;

-- 3. Policies : le client lit ses lignes, l'admin gère tout.
--    Si le client doit ajouter ses propres lignes :
--    WITH CHECK (client_id = auth.uid() OR public.is_admin())
DROP POLICY IF EXISTS "ma_table select" ON public.ma_table;
CREATE POLICY "ma_table select" ON public.ma_table
  FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "ma_table insert" ON public.ma_table;
CREATE POLICY "ma_table insert" ON public.ma_table
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "ma_table update" ON public.ma_table;
CREATE POLICY "ma_table update" ON public.ma_table
  FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "ma_table delete" ON public.ma_table;
CREATE POLICY "ma_table delete" ON public.ma_table
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- 4. GRANT explicites (obligatoires à partir du 30/10/2026)
REVOKE ALL ON public.ma_table FROM anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ma_table TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ma_table TO service_role;
-- anon : aucun droit (table privée)
```

### Adapter les GRANT au besoin réel

Toujours après le `REVOKE ALL` du modèle :

- **Lecture publique** (comme `availability_rules`) :
  `GRANT SELECT ON public.ma_table TO anon;` + une policy
  `FOR SELECT TO anon, authenticated`. Jamais d'écriture pour `anon`.
- **Ajout public** (comme la réservation) :
  `GRANT INSERT ON public.ma_table TO anon;` + une policy `FOR INSERT TO anon`
  avec un `WITH CHECK` strict. Piège : `.insert(...).select()` relit la ligne
  ajoutée ; il faut alors aussi le droit `SELECT` (GRANT **et** policy) pour ce
  rôle, sinon `permission denied`.
- **Table réservée aux edge functions** (journal, file d'envoi, traitement
  IA…) : `GRANT SELECT, INSERT, UPDATE, DELETE ON public.ma_table TO service_role;`
  uniquement, RLS activée sans policy : invisible depuis le navigateur.
- **Séquence** (`serial` / `identity`) :
  `GRANT USAGE, SELECT ON SEQUENCE public.ma_table_id_seq TO authenticated, service_role;`
  (+ `anon` s'il ajoute des lignes). Sans ce GRANT, l'ajout échoue avec
  `permission denied for sequence`.

### Vérifier après exécution (SQL Editor de Supabase)

```sql
SELECT r.rolname AS role,
       has_table_privilege(r.rolname, 'public.ma_table', 'SELECT') AS lire,
       has_table_privilege(r.rolname, 'public.ma_table', 'INSERT') AS ajouter,
       has_table_privilege(r.rolname, 'public.ma_table', 'UPDATE') AS modifier,
       has_table_privilege(r.rolname, 'public.ma_table', 'DELETE') AS supprimer,
       (SELECT relrowsecurity FROM pg_class
         WHERE oid = 'public.ma_table'::regclass) AS rls_activee
FROM pg_roles r
WHERE r.rolname IN ('anon', 'authenticated', 'service_role')
ORDER BY r.rolname;
```

Résultat attendu pour le modèle : `anon` à `false` partout ; `authenticated`
et `service_role` à `true` partout ; `rls_activee` à `true`. Un `false` pour un
rôle qui utilise la table signifie qu'il manque un GRANT. Un `rls_activee` à
`false` est à corriger immédiatement.

### Scripts historiques à ne pas relancer

`setup-database.sql` et `supabase/migrations/20251023115353_create_initial_schema.sql`
(colonnes en camelCase), ainsi que `supabase-schema.sql`, ne contiennent aucun
GRANT et ne correspondent plus à la production : il leur manque des colonnes
ajoutées depuis à la main (`users.status`, `users.password_reset_required`,
`documents.file_path`, `availability_rules.schedule_type`…). Lancés sur un
nouveau projet Supabase, ils créeraient des tables inaccessibles. Historique
des paliers RLS et audit de mai 2026 : `supabase/README.md`.
