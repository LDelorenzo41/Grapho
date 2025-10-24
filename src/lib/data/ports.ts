import type {
  User,
  Appointment,
  Document,
  Message,
  Settings,
  Consent,
  Session,
  Prescription,
  AvailableSlot,
  AvailabilityRule,
} from './types';

// ✅ AJOUT: Type pour la création d'utilisateur avec mot de passe optionnel
export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'> & {
  password?: string;
};

export interface UsersRepository {
  getAll(): Promise<User[]>;
  getById(id: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
  create(user: CreateUserInput): Promise<User>; // ✅ MODIFIÉ: Utilise CreateUserInput au lieu de Omit<User, ...>
  update(id: string, user: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}

export interface AppointmentsRepository {
  getAll(): Promise<Appointment[]>;
  getById(id: string): Promise<Appointment | null>;
  getByClientId(clientId: string): Promise<Appointment[]>;
  getAvailableSlots(startDate: string, endDate: string): Promise<AvailableSlot[]>;
  create(appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment>;
  update(id: string, appointment: Partial<Appointment>): Promise<Appointment>;
  delete(id: string): Promise<void>;
}

export interface DocumentsRepository {
  getAll(): Promise<Document[]>;
  getById(id: string): Promise<Document | null>;
  getByUserId(userId: string): Promise<Document[]>;
  getVisibleToUser(userId: string, userRole: string): Promise<Document[]>;
  create(document: Omit<Document, 'id' | 'uploadedAt'>): Promise<Document>;
  update(id: string, document: Partial<Document>): Promise<Document>;
  delete(id: string): Promise<void>;
}

export interface MessagesRepository {
  getAll(): Promise<Message[]>;
  getById(id: string): Promise<Message | null>;
  getByUserId(userId: string): Promise<Message[]>;
  create(message: Omit<Message, 'id' | 'sentAt'>): Promise<Message>;
  markAsRead(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface SettingsRepository {
  get(): Promise<Settings>;
  update(settings: Partial<Settings>): Promise<Settings>;
}

export interface ConsentsRepository {
  getAll(): Promise<Consent[]>;
  getByUserId(userId: string): Promise<Consent[]>;
  create(consent: Omit<Consent, 'id' | 'grantedAt'>): Promise<Consent>;
  update(id: string, consent: Partial<Consent>): Promise<Consent>;
}

export interface SessionsRepository {
  getAll(): Promise<Session[]>;
  getById(id: string): Promise<Session | null>;
  getByClientId(clientId: string): Promise<Session[]>;
  create(session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<Session>;
  update(id: string, session: Partial<Session>): Promise<Session>;
  delete(id: string): Promise<void>;
}

export interface PrescriptionsRepository {
  getAll(): Promise<Prescription[]>;
  getById(id: string): Promise<Prescription | null>;
  getByClientId(clientId: string): Promise<Prescription[]>;
  create(prescription: Omit<Prescription, 'id' | 'createdAt'>): Promise<Prescription>;
  update(id: string, prescription: Partial<Prescription>): Promise<Prescription>;
  delete(id: string): Promise<void>;
}

export interface AvailabilityRulesRepository {
  getAll(): Promise<AvailabilityRule[]>;
  getById(id: string): Promise<AvailabilityRule | null>;
  create(rule: Omit<AvailabilityRule, 'id'>): Promise<AvailabilityRule>;
  update(id: string, rule: Partial<AvailabilityRule>): Promise<AvailabilityRule>;
  delete(id: string): Promise<void>;
}

export interface DataAdapter {
  users: UsersRepository;
  appointments: AppointmentsRepository;
  documents: DocumentsRepository;
  messages: MessagesRepository;
  settings: SettingsRepository;
  consents: ConsentsRepository;
  sessions: SessionsRepository;
  prescriptions: PrescriptionsRepository;
  availabilityRules: AvailabilityRulesRepository;
}
