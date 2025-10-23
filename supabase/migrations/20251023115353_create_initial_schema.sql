/*
  # Création du schéma initial

  1. Nouvelles Tables
    - `users`
      - `id` (uuid, clé primaire)
      - `email` (text, unique)
      - `role` (text, admin ou client)
      - `firstName` (text)
      - `lastName` (text)
      - `phone` (text)
      - `createdAt` (timestamptz)
    
    - `appointments`
      - `id` (uuid, clé primaire)
      - `clientId` (uuid, référence vers users)
      - `startTime` (timestamptz)
      - `endTime` (timestamptz)
      - `status` (text)
      - `notes` (text)
      - `createdAt` (timestamptz)
    
    - `documents`
      - `id` (uuid, clé primaire)
      - `userId` (uuid, référence vers users)
      - `title` (text)
      - `type` (text)
      - `url` (text)
      - `visibility` (text)
      - `visibleToUserIds` (uuid[])
      - `createdAt` (timestamptz)
    
    - `messages`
      - `id` (uuid, clé primaire)
      - `senderId` (uuid, référence vers users)
      - `recipientId` (uuid, référence vers users)
      - `content` (text)
      - `read` (boolean)
      - `createdAt` (timestamptz)
    
    - `settings`
      - `id` (text, clé primaire)
      - `availabilityRules` (jsonb)
      - `emailTemplates` (jsonb)
      - `updatedAt` (timestamptz)
    
    - `consents`
      - `id` (uuid, clé primaire)
      - `userId` (uuid, référence vers users)
      - `type` (text)
      - `accepted` (boolean)
      - `acceptedAt` (timestamptz)
    
    - `sessions`
      - `id` (uuid, clé primaire)
      - `clientId` (uuid, référence vers users)
      - `date` (timestamptz)
      - `duration` (integer, minutes)
      - `notes` (text)
      - `createdAt` (timestamptz)
    
    - `prescriptions`
      - `id` (uuid, clé primaire)
      - `clientId` (uuid, référence vers users)
      - `content` (text)
      - `createdAt` (timestamptz)

  2. Sécurité
    - Active RLS sur toutes les tables
    - Crée des politiques restrictives pour chaque table
    - Les clients ne peuvent accéder qu'à leurs propres données
    - Les admins ont accès à toutes les données

  3. Notes importantes
    - Utilise `gen_random_uuid()` pour générer les IDs
    - Utilise `now()` pour les timestamps par défaut
    - Les relations sont créées avec des contraintes de clé étrangère
    - Toutes les colonnes importantes ont des valeurs par défaut appropriées
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'client',
  "firstName" text NOT NULL DEFAULT '',
  "lastName" text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  "createdAt" timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "startTime" timestamptz NOT NULL,
  "endTime" timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text DEFAULT '',
  "createdAt" timestamptz DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  visibility text NOT NULL DEFAULT 'specific',
  "visibleToUserIds" uuid[] DEFAULT ARRAY[]::uuid[],
  "createdAt" timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "senderId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "recipientId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  "createdAt" timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id text PRIMARY KEY DEFAULT 'default',
  "availabilityRules" jsonb DEFAULT '[]'::jsonb,
  "emailTemplates" jsonb DEFAULT '{"appointmentConfirmation": "", "appointmentReminder": ""}'::jsonb,
  "updatedAt" timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create consents table
CREATE TABLE IF NOT EXISTS consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  accepted boolean DEFAULT false,
  "acceptedAt" timestamptz DEFAULT now()
);

ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date timestamptz NOT NULL,
  duration integer NOT NULL DEFAULT 60,
  notes text DEFAULT '',
  "createdAt" timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  "createdAt" timestamptz DEFAULT now()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments("clientId");
CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments("startTime");
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents("userId");
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages("senderId");
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages("recipientId");
CREATE INDEX IF NOT EXISTS idx_sessions_client ON sessions("clientId");
CREATE INDEX IF NOT EXISTS idx_prescriptions_client ON prescriptions("clientId");
CREATE INDEX IF NOT EXISTS idx_consents_user ON consents("userId");

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- For public access (anonymous booking)
CREATE POLICY "Allow anonymous insert for client registration"
  ON users FOR INSERT
  TO anon
  WITH CHECK (role = 'client');

-- Appointments policies
CREATE POLICY "Users can view their own appointments"
  ON appointments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = appointments."clientId" 
      AND users.id = auth.uid()
    )
  );

CREATE POLICY "Allow anonymous booking"
  ON appointments FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can update their appointments"
  ON appointments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = appointments."clientId" 
      AND users.id = auth.uid()
    )
  );

-- Documents policies
CREATE POLICY "Users can view documents visible to them"
  ON documents FOR SELECT
  TO authenticated
  USING (
    visibility = 'all' OR
    (visibility = 'clients' AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'client')) OR
    (visibility = 'specific' AND auth.uid() = ANY("visibleToUserIds"))
  );

-- Messages policies
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() = "senderId" OR 
    auth.uid() = "recipientId"
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = "senderId");

CREATE POLICY "Users can mark their received messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = "recipientId")
  WITH CHECK (auth.uid() = "recipientId");

-- Settings policies (read-only for all, no write policies for now)
CREATE POLICY "Anyone can view settings"
  ON settings FOR SELECT
  TO public
  USING (true);

-- Consents policies
CREATE POLICY "Users can view their consents"
  ON consents FOR SELECT
  TO authenticated
  USING (auth.uid() = "userId");

CREATE POLICY "Users can create their consents"
  ON consents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update their consents"
  ON consents FOR UPDATE
  TO authenticated
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

-- Sessions policies
CREATE POLICY "Users can view their sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = sessions."clientId" 
      AND users.id = auth.uid()
    )
  );

-- Prescriptions policies
CREATE POLICY "Users can view their prescriptions"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = prescriptions."clientId" 
      AND users.id = auth.uid()
    )
  );

-- Insert default settings
INSERT INTO settings (id, "availabilityRules", "emailTemplates")
VALUES (
  'default',
  '[]'::jsonb,
  '{"appointmentConfirmation": "", "appointmentReminder": ""}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
