-- ============================================
-- Grapho - Schéma SQL Complet pour Supabase
-- ============================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TYPES ENUM
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'client');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled');
CREATE TYPE document_visibility AS ENUM ('all', 'clients', 'specific');
CREATE TYPE consent_type AS ENUM ('data_processing', 'communications');

-- ============================================
-- FONCTION TRIGGER POUR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TABLE: users
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'client',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Trigger pour updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: appointments
-- ============================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status appointment_status NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Trigger pour updated_at
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: documents
-- ============================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    category TEXT,
    visibility document_visibility NOT NULL DEFAULT 'specific',
    visible_to_user_ids UUID[]
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_visibility ON documents(visibility);
CREATE INDEX idx_documents_visible_to_user_ids ON documents USING GIN(visible_to_user_ids);

-- ============================================
-- TABLE: messages
-- ============================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_read ON messages(read);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);

-- ============================================
-- TABLE: availability_rules
-- ============================================

CREATE TABLE availability_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_availability_rules_day_of_week ON availability_rules(day_of_week);
CREATE INDEX idx_availability_rules_is_active ON availability_rules(is_active);

-- ============================================
-- TABLE: settings
-- ============================================

CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_template_appointment_confirmation TEXT,
    email_template_appointment_reminder TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger pour updated_at
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insérer les paramètres par défaut
INSERT INTO settings (id, email_template_appointment_confirmation, email_template_appointment_reminder)
VALUES (
    uuid_generate_v4(),
    'Bonjour {{firstName}}, votre rendez-vous est confirmé pour le {{date}} à {{time}}.',
    'Rappel : vous avez rendez-vous demain à {{time}}.'
);

-- ============================================
-- TABLE: consents
-- ============================================

CREATE TABLE consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type consent_type NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT FALSE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_consents_user_id ON consents(user_id);
CREATE INDEX idx_consents_type ON consents(type);

-- ============================================
-- TABLE: sessions
-- ============================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    duration INTEGER NOT NULL,
    session_number INTEGER NOT NULL,
    summary TEXT NOT NULL,
    progress TEXT NOT NULL,
    objectives TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_sessions_client_id ON sessions(client_id);
CREATE INDEX idx_sessions_appointment_id ON sessions(appointment_id);
CREATE INDEX idx_sessions_date ON sessions(date DESC);

-- Trigger pour updated_at
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: prescriptions
-- ============================================

CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    exercises TEXT[] NOT NULL,
    frequency TEXT,
    duration TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX idx_prescriptions_client_id ON prescriptions(client_id);
CREATE INDEX idx_prescriptions_session_id ON prescriptions(session_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES: users
-- ============================================

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (id = auth.uid());

-- Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

-- Les admins peuvent créer des utilisateurs
CREATE POLICY "Admins can create users"
    ON users FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- ============================================
-- POLICIES: appointments
-- ============================================

-- Les admins peuvent voir tous les rendez-vous
CREATE POLICY "Admins can view all appointments"
    ON appointments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Les clients peuvent voir leurs propres rendez-vous
CREATE POLICY "Clients can view own appointments"
    ON appointments FOR SELECT
    USING (client_id = auth.uid());

-- Les admins peuvent créer des rendez-vous
CREATE POLICY "Admins can create appointments"
    ON appointments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Les clients peuvent créer leurs propres rendez-vous
CREATE POLICY "Clients can create own appointments"
    ON appointments FOR INSERT
    WITH CHECK (client_id = auth.uid());

-- Les admins peuvent modifier tous les rendez-vous
CREATE POLICY "Admins can update appointments"
    ON appointments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Les clients peuvent annuler leurs propres rendez-vous
CREATE POLICY "Clients can cancel own appointments"
    ON appointments FOR UPDATE
    USING (client_id = auth.uid())
    WITH CHECK (status = 'cancelled');

-- ============================================
-- POLICIES: documents
-- ============================================

-- Les admins peuvent voir tous les documents
CREATE POLICY "Admins can view all documents"
    ON documents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Les utilisateurs peuvent voir leurs propres documents
CREATE POLICY "Users can view own documents"
    ON documents FOR SELECT
    USING (user_id = auth.uid());

-- Les utilisateurs peuvent voir les documents visibles pour tous
CREATE POLICY "Users can view public documents"
    ON documents FOR SELECT
    USING (visibility = 'all');

-- Les clients peuvent voir les documents visibles pour les clients
CREATE POLICY "Clients can view client documents"
    ON documents FOR SELECT
    USING (
        visibility = 'clients' AND
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'client'
        )
    );

-- Les utilisateurs peuvent voir les documents spécifiques auxquels ils ont accès
CREATE POLICY "Users can view specific documents"
    ON documents FOR SELECT
    USING (
        visibility = 'specific' AND
        auth.uid() = ANY(visible_to_user_ids)
    );

-- Les admins peuvent créer des documents
CREATE POLICY "Admins can create documents"
    ON documents FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Les admins peuvent modifier tous les documents
CREATE POLICY "Admins can update documents"
    ON documents FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Les admins peuvent supprimer des documents
CREATE POLICY "Admins can delete documents"
    ON documents FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- ============================================
-- POLICIES: messages
-- ============================================

-- Les utilisateurs peuvent voir les messages qu'ils ont envoyés ou reçus
CREATE POLICY "Users can view own messages"
    ON messages FOR SELECT
    USING (
        sender_id = auth.uid() OR recipient_id = auth.uid()
    );

-- Les utilisateurs peuvent créer des messages
CREATE POLICY "Users can create messages"
    ON messages FOR INSERT
    WITH CHECK (sender_id = auth.uid());

-- Les utilisateurs peuvent marquer leurs messages comme lus
CREATE POLICY "Users can update received messages"
    ON messages FOR UPDATE
    USING (recipient_id = auth.uid());

-- Les utilisateurs peuvent supprimer leurs messages envoyés
CREATE POLICY "Users can delete sent messages"
    ON messages FOR DELETE
    USING (sender_id = auth.uid());

-- ============================================
-- POLICIES: availability_rules
-- ============================================

-- Tout le monde peut voir les règles de disponibilité
CREATE POLICY "Anyone can view availability rules"
    ON availability_rules FOR SELECT
    USING (true);

-- Les admins peuvent gérer les règles de disponibilité
CREATE POLICY "Admins can manage availability rules"
    ON availability_rules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- ============================================
-- POLICIES: settings
-- ============================================

-- Tout le monde peut lire les paramètres
CREATE POLICY "Anyone can view settings"
    ON settings FOR SELECT
    USING (true);

-- Les admins peuvent modifier les paramètres
CREATE POLICY "Admins can update settings"
    ON settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- ============================================
-- POLICIES: consents
-- ============================================

-- Les admins peuvent voir tous les consentements
CREATE POLICY "Admins can view all consents"
    ON consents FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Les utilisateurs peuvent voir leurs propres consentements
CREATE POLICY "Users can view own consents"
    ON consents FOR SELECT
    USING (user_id = auth.uid());

-- Les utilisateurs peuvent créer leurs consentements
CREATE POLICY "Users can create own consents"
    ON consents FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Les utilisateurs peuvent modifier leurs consentements
CREATE POLICY "Users can update own consents"
    ON consents FOR UPDATE
    USING (user_id = auth.uid());

-- ============================================
-- POLICIES: sessions
-- ============================================

-- Les admins peuvent voir toutes les séances
CREATE POLICY "Admins can view all sessions"
    ON sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Les clients peuvent voir leurs propres séances
CREATE POLICY "Clients can view own sessions"
    ON sessions FOR SELECT
    USING (client_id = auth.uid());

-- Les admins peuvent gérer toutes les séances
CREATE POLICY "Admins can manage sessions"
    ON sessions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- ============================================
-- POLICIES: prescriptions
-- ============================================

-- Les admins peuvent voir toutes les prescriptions
CREATE POLICY "Admins can view all prescriptions"
    ON prescriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Les clients peuvent voir leurs propres prescriptions
CREATE POLICY "Clients can view own prescriptions"
    ON prescriptions FOR SELECT
    USING (client_id = auth.uid());

-- Les admins peuvent gérer toutes les prescriptions
CREATE POLICY "Admins can manage prescriptions"
    ON prescriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Fonction pour obtenir les créneaux disponibles
CREATE OR REPLACE FUNCTION get_available_slots(
    start_date DATE,
    end_date DATE,
    slot_duration INTEGER DEFAULT 60
)
RETURNS TABLE (
    slot_date DATE,
    slot_start TIME,
    slot_end TIME
) AS $$
DECLARE
    loop_date DATE := start_date;
    rule RECORD;
    slot_start_time TIME;
    slot_end_time TIME;
BEGIN
    WHILE loop_date <= end_date LOOP
        FOR rule IN
            SELECT * FROM availability_rules
            WHERE day_of_week = EXTRACT(DOW FROM loop_date)::INTEGER
            AND is_active = TRUE
        LOOP
            slot_start_time := rule.start_time;
            WHILE slot_start_time + (slot_duration || ' minutes')::INTERVAL <= rule.end_time LOOP
                slot_end_time := slot_start_time + (slot_duration || ' minutes')::INTERVAL;

                -- Vérifier si le créneau n'est pas déjà pris
                IF NOT EXISTS (
                    SELECT 1 FROM appointments AS appt
                    WHERE DATE(appt.start_time) = loop_date
                    AND appt.start_time::TIME < slot_end_time
                    AND appt.end_time::TIME > slot_start_time
                    AND appt.status != 'cancelled'
                ) THEN
                    slot_date := loop_date;
                    slot_start := slot_start_time;
                    slot_end := slot_end_time;
                    RETURN NEXT;
                END IF;

                slot_start_time := slot_end_time;
            END LOOP;
        END LOOP;
        loop_date := loop_date + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DONNÉES DE TEST (OPTIONNEL)
-- ============================================

-- Créer un utilisateur admin de test
-- NOTE: Commenté par défaut - décommenter pour créer des données de test
/*
INSERT INTO users (email, role, first_name, last_name, phone)
VALUES
    ('admin@grapho.com', 'admin', 'Admin', 'Grapho', '+33612345678'),
    ('client@example.com', 'client', 'Jean', 'Dupont', '+33698765432');
*/

-- ============================================
-- FIN DU SCHÉMA
-- ============================================
