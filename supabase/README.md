# Supabase — conventions base de données

## Échéance Supabase « Data API / GRANT » — 30 octobre 2026

À partir du **30 octobre 2026**, sur les projets existants, Supabase **n'expose
plus automatiquement** les tables du schéma `public` à la Data API
(supabase-js / PostgREST / GraphQL). Toute table créée **sans GRANT explicite**
sera inaccessible via l'API (erreur PostgREST `42501` indiquant le GRANT
manquant).

**État du projet (audité le 2026-05-19) : conforme.**
Les tables existantes (`users`, `appointments`, `messages`, `sessions`,
`prescriptions`, `consents`, `documents`, `availability_rules`, `settings`)
ont des GRANT explicites pour `anon`, `authenticated`, `service_role` :
elles conservent leurs privilèges après le 30 octobre 2026. **Aucune action
requise sur l'existant.**

La seule contrainte concerne **les nouvelles tables**.

## Règle obligatoire : toute nouvelle table dans `public`

Toute migration qui crée une table dans `public` destinée à la Data API
**doit** inclure, dans le même fichier de migration :

1. les `GRANT` explicites par rôle ;
2. l'activation de la RLS ;
3. au moins une policy d'accès.

Sans ça : table invisible via l'API (échéance) **et/ou** accès non maîtrisé.

## Modèle à copier

```sql
-- 1. Table
CREATE TABLE IF NOT EXISTS public.ma_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. GRANT explicites (requis depuis l'echeance du 30/10/2026)
--    N'accorder a anon que le strict necessaire (souvent : rien, ou SELECT).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ma_table TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ma_table TO service_role;
-- GRANT SELECT ON public.ma_table TO anon;   -- a activer seulement si besoin public

-- 3. RLS
ALTER TABLE public.ma_table ENABLE ROW LEVEL SECURITY;

-- 4. Policies (isolation par utilisateur ; admin via public.is_admin())
CREATE POLICY "ma_table select" ON public.ma_table
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "ma_table insert" ON public.ma_table
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "ma_table update" ON public.ma_table
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "ma_table delete" ON public.ma_table
  FOR DELETE TO authenticated
  USING (public.is_admin());
```

Pour exposer une RPC au public sans exposer la table, suivre le modèle des
fonctions `SECURITY DEFINER` (`email_exists`, `get_busy_slots`,
`is_admin`) : voir la migration `*_palier_2b2_*`.

## Historique sécurité RLS (paliers appliqués)

| Migration | Objet |
|---|---|
| `*_palier_2a_*`  | Fermeture accès `anon` sur les tables sensibles |
| `*_palier_2b1_*` | `is_admin()` + isolation client-par-client |
| `*_palier_2b2_*` | RPC réservation + fermeture `anon` sur `users`/`appointments` |

## Durcissement GRANT — non fait, optionnel (à revoir plus tard)

Audit du 2026-05-19 : `anon`, `authenticated`, `service_role` disposent de
**tous** les privilèges (SELECT/INSERT/UPDATE/DELETE/TRUNCATE) sur **toutes**
les tables — défaut historique Supabase. **Actuellement neutralisé par la
RLS** (anon filtré, prouvé : tables -> `[]` en anon). **Non requis pour
l'échéance du 30/10/2026** (aucun impact conformité Data API).

### Synthèse des risques réels si on ne durcit pas

Le risque n'est pas « exploitable aujourd'hui » mais la **fragilité d'un
modèle à une seule couche** : toute la protection repose sur « RLS active et
correcte sur chaque table, pour toujours ».

| Scénario | Exploitable aujourd'hui ? | Impact si déclenché |
|---|---|---|
| RLS désactivée par erreur sur une table | Non tant que RLS ON ; oui dès qu'elle saute | `anon` lit **et supprime** toutes les lignes via REST (santé/RGPD) ; récup PITR/backup seulement |
| Nouvelle table sans `ENABLE RLS` (oubli) | Possible (erreur humaine) | Idem : exposition + écriture/suppression totale |
| Policy boguée (`USING(true)`, erreur logique) | Possible avec la churn | GRANT large => rayon de souffle inclut écriture/suppression |
| `TRUNCATE` accordé à `anon` | **Non** via Data API (PostgREST ne l'expose pas) | À relativiser : non atteignable par le web role |
| Audit / revue RGPD | N/A | Finding garanti (violation moindre privilège) même si RLS mitige |

**Bottom line :** ne rien faire n'expose à rien *aujourd'hui*, mais laisse la
sécurité en équilibre sur une seule jambe (la RLS). Une **seule erreur** (RLS
oubliée/désactivée, policy permissive) fait passer le rayon de souffle de
« rien » à « anon lit ET détruit toutes les données via REST ». Probabilité
faible mais croissante (nouveaux devs/tables) ; gravité élevée (données de
santé / RGPD).

### Renforcement recommandé (quand du temps disponible)

Mode **staged** (canari + rollback), comme la campagne RLS :
- retirer à `anon` les privilèges destructifs (ne garder que le strict
  nécessaire à la réservation : `INSERT` sur `users`/`appointments`, etc.) ;
- aligner `authenticated` sur `SELECT/INSERT/UPDATE/DELETE` (pas `TRUNCATE`) ;
- vérifier chaque parcours (réservation publique incluse) avant/après.
