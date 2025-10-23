-- ============================================
-- GRAPHO - Database Setup Script
-- Execute this in Supabase SQL Editor
-- ============================================

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments("clientId");
CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments("startTime");
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents("userId");
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages("senderId");
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages("recipientId");
CREATE INDEX IF NOT EXISTS idx_sessions_client ON sessions("clientId");
CREATE INDEX IF NOT EXISTS idx_prescriptions_client ON prescriptions("clientId");
CREATE INDEX IF NOT EXISTS idx_consents_user ON consents("userId");

-- Users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow anonymous insert for client registration" ON users;
CREATE POLICY "Allow anonymous insert for client registration" ON users FOR INSERT TO anon WITH CHECK (role = 'client');

-- Appointments policies
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
CREATE POLICY "Users can view their own appointments" ON appointments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = appointments."clientId" AND users.id = auth.uid()));

DROP POLICY IF EXISTS "Allow anonymous booking" ON appointments;
CREATE POLICY "Allow anonymous booking" ON appointments FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their appointments" ON appointments;
CREATE POLICY "Users can update their appointments" ON appointments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = appointments."clientId" AND users.id = auth.uid()));

-- Documents policies
DROP POLICY IF EXISTS "Users can view documents visible to them" ON documents;
CREATE POLICY "Users can view documents visible to them" ON documents FOR SELECT TO authenticated USING (visibility = 'all' OR (visibility = 'clients' AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'client')) OR (visibility = 'specific' AND auth.uid() = ANY("visibleToUserIds")));

-- Messages policies
DROP POLICY IF EXISTS "Users can view their messages" ON messages;
CREATE POLICY "Users can view their messages" ON messages FOR SELECT TO authenticated USING (auth.uid() = "senderId" OR auth.uid() = "recipientId");

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = "senderId");

DROP POLICY IF EXISTS "Users can mark their received messages as read" ON messages;
CREATE POLICY "Users can mark their received messages as read" ON messages FOR UPDATE TO authenticated USING (auth.uid() = "recipientId") WITH CHECK (auth.uid() = "recipientId");

-- Settings policies
DROP POLICY IF EXISTS "Anyone can view settings" ON settings;
CREATE POLICY "Anyone can view settings" ON settings FOR SELECT TO public USING (true);

-- Consents policies
DROP POLICY IF EXISTS "Users can view their consents" ON consents;
CREATE POLICY "Users can view their consents" ON consents FOR SELECT TO authenticated USING (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can create their consents" ON consents;
CREATE POLICY "Users can create their consents" ON consents FOR INSERT TO authenticated WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS "Users can update their consents" ON consents;
CREATE POLICY "Users can update their consents" ON consents FOR UPDATE TO authenticated USING (auth.uid() = "userId") WITH CHECK (auth.uid() = "userId");

-- Sessions policies
DROP POLICY IF EXISTS "Users can view their sessions" ON sessions;
CREATE POLICY "Users can view their sessions" ON sessions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = sessions."clientId" AND users.id = auth.uid()));

-- Prescriptions policies
DROP POLICY IF EXISTS "Users can view their prescriptions" ON prescriptions;
CREATE POLICY "Users can view their prescriptions" ON prescriptions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = prescriptions."clientId" AND users.id = auth.uid()));

-- Insert default settings
INSERT INTO settings (id, "availabilityRules", "emailTemplates")
VALUES ('default', '[]'::jsonb, '{"appointmentConfirmation": "", "appointmentReminder": ""}'::jsonb)
ON CONFLICT (id) DO NOTHING;
