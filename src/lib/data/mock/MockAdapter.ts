import type { DataAdapter } from '../ports';
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
} from '../types';

const STORAGE_KEY = 'graphotherapie_mock_data';

interface MockData {
  users: User[];
  appointments: Appointment[];
  documents: Document[];
  messages: Message[];
  settings: Settings;
  consents: Consent[];
  sessions: Session[];
  prescriptions: Prescription[];
}

class MockStorage {
  private data: MockData;

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      this.data = JSON.parse(stored);
    } else {
      this.data = this.getSeedData();
      this.save();
    }
  }

  private getSeedData(): MockData {
    const now = new Date().toISOString();

    return {
      users: [
        {
          id: 'admin-1',
          email: 'admin@graphotherapie.fr',
          role: 'admin',
          firstName: 'Sophie',
          lastName: 'Martin',
          phone: '06 12 34 56 78',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'client-1',
          email: 'marie.dupont@example.com',
          role: 'client',
          firstName: 'Marie',
          lastName: 'Dupont',
          phone: '06 23 45 67 89',
          dateOfBirth: '2010-05-15',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'client-2',
          email: 'lucas.bernard@example.com',
          role: 'client',
          firstName: 'Lucas',
          lastName: 'Bernard',
          phone: '06 34 56 78 90',
          dateOfBirth: '2012-09-22',
          createdAt: now,
          updatedAt: now,
        },
      ],
      appointments: [
        {
          id: 'apt-1',
          clientId: 'client-1',
          startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
          status: 'scheduled',
          notes: 'Séance de suivi',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'apt-2',
          clientId: 'client-2',
          startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
          status: 'scheduled',
          notes: 'Première séance',
          createdAt: now,
          updatedAt: now,
        },
      ],
      documents: [
        {
          id: 'doc-1',
          userId: 'admin-1',
          uploadedBy: 'admin-1',
          fileName: 'bilan_initial.pdf',
          fileType: 'application/pdf',
          fileSize: 524288,
          uploadedAt: now,
          category: 'Bilans',
          visibility: 'specific',
          visibleToUserIds: ['client-1', 'admin-1'],
        },
        {
          id: 'doc-2',
          userId: 'client-1',
          uploadedBy: 'client-1',
          fileName: 'ordonnance_medicale.pdf',
          fileType: 'application/pdf',
          fileSize: 389120,
          uploadedAt: now,
          category: 'Documents médicaux',
          visibility: 'specific',
          visibleToUserIds: ['client-1', 'admin-1'],
        },
      ],
      messages: [
        {
          id: 'msg-1',
          senderId: 'admin-1',
          recipientId: 'client-1',
          subject: 'Confirmation de votre rendez-vous',
          content: 'Bonjour Marie, votre rendez-vous est bien confirmé.',
          read: false,
          sentAt: now,
        },
      ],
      settings: {
        id: 'settings-1',
        availabilityRules: [
          {
            id: 'rule-1',
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '12:00',
            isActive: true,
          },
          {
            id: 'rule-2',
            dayOfWeek: 1,
            startTime: '14:00',
            endTime: '18:00',
            isActive: true,
          },
          {
            id: 'rule-3',
            dayOfWeek: 3,
            startTime: '09:00',
            endTime: '12:00',
            isActive: true,
          },
          {
            id: 'rule-4',
            dayOfWeek: 3,
            startTime: '14:00',
            endTime: '18:00',
            isActive: true,
          },
          {
            id: 'rule-5',
            dayOfWeek: 5,
            startTime: '09:00',
            endTime: '12:00',
            isActive: true,
          },
        ],
        emailTemplates: {
          appointmentConfirmation: 'Bonjour {firstName},\n\nVotre rendez-vous du {date} à {time} est confirmé.\n\nÀ bientôt,\nSophie Martin',
          appointmentReminder: 'Bonjour {firstName},\n\nRappel : vous avez rendez-vous demain à {time}.\n\nÀ bientôt,\nSophie Martin',
        },
        updatedAt: now,
      },
      consents: [
        {
          id: 'consent-1',
          userId: 'client-1',
          type: 'data_processing',
          granted: true,
          grantedAt: now,
        },
        {
          id: 'consent-2',
          userId: 'client-1',
          type: 'communications',
          granted: true,
          grantedAt: now,
        },
      ],
      sessions: [
        {
          id: 'session-1',
          clientId: 'client-1',
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 45,
          sessionNumber: 1,
          summary: 'Première séance - bilan initial complet',
          progress: 'Évaluation de la posture, tenue du crayon, vitesse d\'écriture',
          objectives: 'Améliorer la tenue du crayon et la posture',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'session-2',
          clientId: 'client-1',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 45,
          sessionNumber: 2,
          summary: 'Travail sur la relaxation et la motricité fine',
          progress: 'Bonne amélioration de la tenue du crayon',
          objectives: 'Continuer les exercices de relaxation',
          createdAt: now,
          updatedAt: now,
        },
      ],
      prescriptions: [
        {
          id: 'prescription-1',
          clientId: 'client-1',
          sessionId: 'session-1',
          title: 'Exercices de relaxation',
          description: 'Exercices quotidiens pour détendre la main et le poignet',
          exercises: [
            'Rotation des poignets (5 min)',
            'Étirements des doigts',
            'Massage de la main',
          ],
          frequency: 'Quotidien',
          duration: '10 minutes',
          createdAt: now,
        },
        {
          id: 'prescription-2',
          clientId: 'client-1',
          sessionId: 'session-2',
          title: 'Graphisme',
          description: 'Exercices de graphisme pour améliorer la fluidité',
          exercises: [
            'Boucles et ponts (2 lignes)',
            'Lettres rondes (a, o, d)',
            'Copie de mots simples',
          ],
          frequency: '3 fois par semaine',
          duration: '15 minutes',
          createdAt: now,
        },
      ],
    };
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  getData() {
    return this.data;
  }

  setData(data: MockData) {
    this.data = data;
    this.save();
  }
}

const storage = new MockStorage();

export const createMockAdapter = (): DataAdapter => {
  return {
    users: {
      async getAll() {
        return storage.getData().users;
      },
      async getById(id: string) {
        return storage.getData().users.find(u => u.id === id) || null;
      },
      async getByEmail(email: string) {
        return storage.getData().users.find(u => u.email === email) || null;
      },
      async create(user) {
        const newUser: User = {
          ...user,
          id: `user-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const data = storage.getData();
        data.users.push(newUser);
        storage.setData(data);
        return newUser;
      },
      async update(id: string, updates: Partial<User>) {
        const data = storage.getData();
        const index = data.users.findIndex(u => u.id === id);
        if (index === -1) throw new Error('User not found');
        data.users[index] = {
          ...data.users[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        storage.setData(data);
        return data.users[index];
      },
      async delete(id: string) {
        const data = storage.getData();
        data.users = data.users.filter(u => u.id !== id);
        storage.setData(data);
      },
    },
    appointments: {
      async getAll() {
        return storage.getData().appointments;
      },
      async getById(id: string) {
        return storage.getData().appointments.find(a => a.id === id) || null;
      },
      async getByClientId(clientId: string) {
        return storage.getData().appointments.filter(a => a.clientId === clientId);
      },
      async getAvailableSlots(startDate: string, endDate: string): Promise<AvailableSlot[]> {
        const data = storage.getData();
        const settings = data.settings;
        const appointments = data.appointments;

        const slots: AvailableSlot[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
          const dayOfWeek = date.getDay();
          const dateStr = date.toISOString().split('T')[0];

          const rules = settings.availabilityRules.filter(
            rule => rule.dayOfWeek === dayOfWeek && rule.isActive
          );

          for (const rule of rules) {
            const startHour = parseInt(rule.startTime.split(':')[0]);
            const endHour = parseInt(rule.endTime.split(':')[0]);

            for (let hour = startHour; hour < endHour; hour++) {
              const slotStart = `${hour.toString().padStart(2, '0')}:00:00`;
              const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00:00`;

              const slotStartTime = new Date(`${dateStr}T${slotStart}`).toISOString();
              const slotEndTime = new Date(`${dateStr}T${slotEnd}`).toISOString();

              const isBooked = appointments.some(apt => {
                const aptStart = new Date(apt.startTime);
                const aptEnd = new Date(apt.endTime);
                const currentSlotStart = new Date(slotStartTime);
                const currentSlotEnd = new Date(slotEndTime);

                return (
                  apt.status !== 'cancelled' &&
                  ((currentSlotStart >= aptStart && currentSlotStart < aptEnd) ||
                    (currentSlotEnd > aptStart && currentSlotEnd <= aptEnd) ||
                    (currentSlotStart <= aptStart && currentSlotEnd >= aptEnd))
                );
              });

              if (!isBooked && new Date(slotStartTime) > new Date()) {
                slots.push({
                  date: dateStr,
                  startTime: slotStart,
                  endTime: slotEnd,
                });
              }
            }
          }
        }

        return slots;
      },
      async create(appointment) {
        const newAppointment: Appointment = {
          ...appointment,
          id: `apt-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const data = storage.getData();
        data.appointments.push(newAppointment);
        storage.setData(data);
        return newAppointment;
      },
      async update(id: string, updates: Partial<Appointment>) {
        const data = storage.getData();
        const index = data.appointments.findIndex(a => a.id === id);
        if (index === -1) throw new Error('Appointment not found');
        data.appointments[index] = {
          ...data.appointments[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        storage.setData(data);
        return data.appointments[index];
      },
      async delete(id: string) {
        const data = storage.getData();
        data.appointments = data.appointments.filter(a => a.id !== id);
        storage.setData(data);
      },
    },
    documents: {
      async getAll() {
        return storage.getData().documents;
      },
      async getById(id: string) {
        return storage.getData().documents.find(d => d.id === id) || null;
      },
      async getByUserId(userId: string) {
        return storage.getData().documents.filter(d => d.userId === userId);
      },
      async getVisibleToUser(userId: string, userRole: string) {
        const docs = storage.getData().documents;
        return docs.filter(d => {
          if (userRole === 'admin') return true;
          if (d.visibility === 'all') return true;
          if (d.visibility === 'clients' && userRole === 'client') return true;
          if (d.visibility === 'specific' && d.visibleToUserIds?.includes(userId)) return true;
          return false;
        });
      },
      async create(document) {
        const newDocument: Document = {
          ...document,
          id: `doc-${Date.now()}`,
          uploadedAt: new Date().toISOString(),
        };
        const data = storage.getData();
        data.documents.push(newDocument);
        storage.setData(data);
        return newDocument;
      },
      async update(id: string, updates: Partial<Document>) {
        const data = storage.getData();
        const index = data.documents.findIndex(d => d.id === id);
        if (index === -1) throw new Error('Document not found');
        data.documents[index] = {
          ...data.documents[index],
          ...updates,
        };
        storage.setData(data);
        return data.documents[index];
      },
      async delete(id: string) {
        const data = storage.getData();
        data.documents = data.documents.filter(d => d.id !== id);
        storage.setData(data);
      },
    },
    messages: {
      async getAll() {
        return storage.getData().messages;
      },
      async getById(id: string) {
        return storage.getData().messages.find(m => m.id === id) || null;
      },
      async getByUserId(userId: string) {
        return storage.getData().messages.filter(
          m => m.senderId === userId || m.recipientId === userId
        );
      },
      async create(message) {
        const newMessage: Message = {
          ...message,
          id: `msg-${Date.now()}`,
          sentAt: new Date().toISOString(),
        };
        const data = storage.getData();
        data.messages.push(newMessage);
        storage.setData(data);
        return newMessage;
      },
      async markAsRead(id: string) {
        const data = storage.getData();
        const message = data.messages.find(m => m.id === id);
        if (message) {
          message.read = true;
          storage.setData(data);
        }
      },
      async delete(id: string) {
        const data = storage.getData();
        data.messages = data.messages.filter(m => m.id !== id);
        storage.setData(data);
      },
    },
    settings: {
      async get() {
        return storage.getData().settings;
      },
      async update(updates: Partial<Settings>) {
        const data = storage.getData();
        data.settings = {
          ...data.settings,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        storage.setData(data);
        return data.settings;
      },
    },
    consents: {
      async getAll() {
        return storage.getData().consents;
      },
      async getByUserId(userId: string) {
        return storage.getData().consents.filter(c => c.userId === userId);
      },
      async create(consent) {
        const newConsent: Consent = {
          ...consent,
          id: `consent-${Date.now()}`,
          grantedAt: new Date().toISOString(),
        };
        const data = storage.getData();
        data.consents.push(newConsent);
        storage.setData(data);
        return newConsent;
      },
      async update(id: string, updates: Partial<Consent>) {
        const data = storage.getData();
        const index = data.consents.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Consent not found');
        data.consents[index] = {
          ...data.consents[index],
          ...updates,
        };
        storage.setData(data);
        return data.consents[index];
      },
    },
    sessions: {
      async getAll() {
        return storage.getData().sessions;
      },
      async getById(id: string) {
        return storage.getData().sessions.find(s => s.id === id) || null;
      },
      async getByClientId(clientId: string) {
        return storage.getData().sessions.filter(s => s.clientId === clientId);
      },
      async create(session) {
        const newSession: Session = {
          ...session,
          id: `session-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const data = storage.getData();
        data.sessions.push(newSession);
        storage.setData(data);
        return newSession;
      },
      async update(id: string, updates: Partial<Session>) {
        const data = storage.getData();
        const index = data.sessions.findIndex(s => s.id === id);
        if (index === -1) throw new Error('Session not found');
        data.sessions[index] = {
          ...data.sessions[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        storage.setData(data);
        return data.sessions[index];
      },
      async delete(id: string) {
        const data = storage.getData();
        data.sessions = data.sessions.filter(s => s.id !== id);
        storage.setData(data);
      },
    },
    prescriptions: {
      async getAll() {
        return storage.getData().prescriptions;
      },
      async getById(id: string) {
        return storage.getData().prescriptions.find(p => p.id === id) || null;
      },
      async getByClientId(clientId: string) {
        return storage.getData().prescriptions.filter(p => p.clientId === clientId);
      },
      async create(prescription) {
        const newPrescription: Prescription = {
          ...prescription,
          id: `prescription-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        const data = storage.getData();
        data.prescriptions.push(newPrescription);
        storage.setData(data);
        return newPrescription;
      },
      async update(id: string, updates: Partial<Prescription>) {
        const data = storage.getData();
        const index = data.prescriptions.findIndex(p => p.id === id);
        if (index === -1) throw new Error('Prescription not found');
        data.prescriptions[index] = {
          ...data.prescriptions[index],
          ...updates,
        };
        storage.setData(data);
        return data.prescriptions[index];
      },
      async delete(id: string) {
        const data = storage.getData();
        data.prescriptions = data.prescriptions.filter(p => p.id !== id);
        storage.setData(data);
      },
    },
  };
};
