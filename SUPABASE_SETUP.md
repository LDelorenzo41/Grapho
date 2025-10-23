# Configuration Supabase pour Grapho

## Étapes d'installation

### 1. Créer un projet Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre **URL du projet** et votre **clé API anonyme (anon key)**

### 2. Exécuter le schéma SQL

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Créez une nouvelle requête
3. Copiez tout le contenu du fichier `supabase-schema.sql`
4. Collez-le dans l'éditeur SQL
5. Cliquez sur **Run** pour exécuter le script

Le script va créer :
- ✅ Toutes les tables nécessaires (users, appointments, documents, etc.)
- ✅ Les types ENUM (user_role, appointment_status, etc.)
- ✅ Les index pour optimiser les performances
- ✅ Les politiques RLS (Row Level Security) pour sécuriser les données
- ✅ Les triggers pour la mise à jour automatique des timestamps
- ✅ Une fonction utilitaire pour obtenir les créneaux disponibles

### 3. Configurer l'authentification

#### Option A: Authentification par email/mot de passe

1. Dans Supabase, allez dans **Authentication** > **Providers**
2. Activez **Email**
3. Configurez les paramètres selon vos besoins

#### Option B: Authentification Magic Link

1. Dans **Authentication** > **Providers**
2. Activez **Email** et cochez **Enable Magic Link**

### 4. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
VITE_SUPABASE_URL=votre-url-supabase
VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

Remplacez les valeurs par celles de votre projet Supabase (disponibles dans **Settings** > **API**).

### 5. Créer le premier utilisateur admin

Vous avez deux options :

#### Option A: Via l'interface Supabase

1. Allez dans **Authentication** > **Users**
2. Cliquez sur **Add user** > **Create new user**
3. Créez un utilisateur avec email/mot de passe
4. Allez dans **Table Editor** > **users**
5. Trouvez l'utilisateur créé et modifiez son champ `role` à `admin`

#### Option B: Via SQL

```sql
-- 1. Créer l'utilisateur dans auth.users (dans SQL Editor)
-- Remplacez les valeurs par vos informations
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    uuid_generate_v4(),
    'authenticated',
    'authenticated',
    'admin@grapho.com',
    crypt('votre-mot-de-passe', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    ''
)
RETURNING id;

-- 2. Créer le profil dans la table users (utilisez l'id retourné ci-dessus)
INSERT INTO users (id, email, role, first_name, last_name, phone)
VALUES (
    'id-retourné-ci-dessus',
    'admin@grapho.com',
    'admin',
    'Admin',
    'Grapho',
    '+33612345678'
);
```

### 6. Tester la connexion

1. Démarrez votre application : `npm run dev`
2. Allez sur la page de connexion
3. Connectez-vous avec les identifiants admin créés
4. Vous devriez avoir accès au tableau de bord admin

## Structure des tables

### users
Contient tous les utilisateurs (admin et clients)
- `role`: 'admin' ou 'client'
- Les clients peuvent voir/modifier uniquement leurs données
- Les admins ont accès à tout

### appointments
Gestion des rendez-vous
- Lié à un client (client_id)
- Statut: 'scheduled', 'completed', 'cancelled'
- Les créneaux horaires sont validés (end_time > start_time)

### documents
Stockage des métadonnées des documents
- `visibility`: 'all', 'clients', 'specific'
- `visible_to_user_ids`: tableau d'IDs pour visibilité spécifique
- Note: Les fichiers réels doivent être stockés dans Supabase Storage

### messages
Messagerie interne entre admin et clients
- Champ `read` pour suivre la lecture

### availability_rules
Règles de disponibilité pour les rendez-vous
- `day_of_week`: 0 (dimanche) à 6 (samedi)
- Heures de début et fin

### settings
Configuration globale de l'application
- Templates d'emails
- Une seule ligne dans cette table

### consents
Consentements RGPD
- Types: 'data_processing', 'communications'

### sessions
Comptes-rendus de séances de graphothérapie
- Lié à un client et potentiellement un rendez-vous
- Numéro de séance, durée, résumé, progrès

### prescriptions
Prescriptions d'exercices de graphothérapie
- Lié à un client et potentiellement une séance
- Liste d'exercices, fréquence, durée

## Configuration du stockage de fichiers

Pour stocker les fichiers réels (documents) :

1. Dans Supabase, allez dans **Storage**
2. Créez un nouveau bucket nommé `documents`
3. Configurez les politiques RLS pour ce bucket :

```sql
-- Permettre aux admins de télécharger des fichiers
CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'documents' AND
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Permettre aux utilisateurs de voir les documents selon la visibilité
CREATE POLICY "Users can view documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'documents' AND
    EXISTS (
        SELECT 1 FROM documents d
        WHERE d.file_name = storage.objects.name
        AND (
            d.visibility = 'all'
            OR (d.visibility = 'clients' AND EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'client'
            ))
            OR (d.visibility = 'specific' AND auth.uid() = ANY(d.visible_to_user_ids))
            OR d.user_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
            )
        )
    )
);
```

## Fonctions utiles

### get_available_slots()

Fonction SQL pour obtenir les créneaux disponibles :

```sql
SELECT * FROM get_available_slots(
    '2024-01-01'::DATE,  -- Date de début
    '2024-01-31'::DATE,  -- Date de fin
    60                    -- Durée du créneau en minutes (optionnel, défaut: 60)
);
```

## Sécurité

Le schéma implémente Row Level Security (RLS) sur toutes les tables :

- **Admins** : Accès complet à toutes les données
- **Clients** : Accès limité à leurs propres données
- **Anonymes** : Pas d'accès (sauf availability_rules et settings en lecture)

Les politiques RLS sont automatiquement appliquées à tous les requêtes, y compris celles de votre application.

## Maintenance

### Sauvegardes

Supabase effectue des sauvegardes automatiques. Pour des sauvegardes manuelles :

1. Allez dans **Database** > **Backups**
2. Cliquez sur **Create backup**

### Migrations

Pour des modifications futures du schéma :

1. Créez un nouveau fichier SQL de migration
2. Exécutez-le dans SQL Editor
3. Documentez les changements

## Support

Pour toute question sur Supabase :
- Documentation : [https://supabase.com/docs](https://supabase.com/docs)
- Discord : [https://discord.supabase.com](https://discord.supabase.com)
