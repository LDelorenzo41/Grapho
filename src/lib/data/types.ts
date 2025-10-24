export type UserRole = 'admin' | 'client';

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type DocumentVisibility = 'all' | 'clients' | 'specific';

export interface Document {
  id: string;
  userId: string;
  uploadedBy: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  category?: string;
  visibility: DocumentVisibility;
  visibleToUserIds?: string[];
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  content: string;
  read: boolean;
  sentAt: string;
}

export interface AvailabilityRule {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface AvailableSlot {
  date: string;
  startTime: string;
  endTime: string;
}

export interface Settings {
  id: string;
  availabilityRules: AvailabilityRule[];  // ← LIGNE AJOUTÉE
  emailTemplates: {
    appointmentConfirmation: string;
    appointmentReminder: string;
  };
  updatedAt: string;
}

export interface Consent {
  id: string;
  userId: string;
  type: 'data_processing' | 'communications';
  granted: boolean;
  grantedAt: string;
}

export interface Session {
  id: string;
  clientId: string;
  appointmentId?: string;
  date: string;
  duration: number;
  sessionNumber: number;
  summary: string;
  progress: string;
  objectives?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  clientId: string;
  sessionId?: string;
  title: string;
  description: string;
  exercises: string[];
  frequency?: string;
  duration?: string;
  createdAt: string;
}
