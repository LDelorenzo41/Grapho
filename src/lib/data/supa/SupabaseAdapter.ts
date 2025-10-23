import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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

const getSupabaseClient = (): SupabaseClient | null => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('Supabase credentials not configured');
    return null;
  }

  return createClient(url, key);
};

export const createSupabaseAdapter = (): DataAdapter => {
  const supabase = getSupabaseClient();

  return {
    users: {
      async getAll() {
        if (!supabase) return [];
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        return data || [];
      },
      async getById(id: string) {
        if (!supabase) return null;
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data;
      },
      async getByEmail(email: string) {
        if (!supabase) return null;
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();
        if (error) throw error;
        return data;
      },
      async create(user) {
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase
          .from('users')
          .insert(user)
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      async update(id: string, updates: Partial<User>) {
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      async delete(id: string) {
        if (!supabase) throw new Error('Supabase not configured');
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
      },
    },
    appointments: {
      async getAll() {
        if (!supabase) return [];
        const { data, error } = await supabase.from('appointments').select('*');
        if (error) throw error;
        return data || [];
      },
      async getById(id: string) {
        if (!supabase) return null;
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data;
      },
      async getByClientId(clientId: string) {
        if (!supabase) return [];
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('clientId', clientId);
        if (error) throw error;
        return data || [];
      },
      async getAvailableSlots(startDate: string, endDate: string): Promise<AvailableSlot[]> {
        if (!supabase) return [];

        const { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .maybeSingle();
        if (settingsError) throw settingsError;
        if (!settingsData) return [];

        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*');
        if (appointmentsError) throw appointmentsError;
        if (!appointmentsData) return [];

        const slots: AvailableSlot[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
          const dayOfWeek = date.getDay();
          const dateStr = date.toISOString().split('T')[0];

          const rules = settingsData.availabilityRules.filter(
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

              const isBooked = appointmentsData.some(apt => {
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
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase
          .from('appointments')
          .insert(appointment)
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      async update(id: string, updates: Partial<Appointment>) {
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase
          .from('appointments')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      async delete(id: string) {
        if (!supabase) throw new Error('Supabase not configured');
        const { error } = await supabase.from('appointments').delete().eq('id', id);
        if (error) throw error;
      },
    },
    documents: {
      async getAll() {
        if (!supabase) return [];
        const { data, error } = await supabase.from('documents').select('*');
        if (error) throw error;
        return data || [];
      },
      async getById(id: string) {
        if (!supabase) return null;
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data;
      },
      async getByUserId(userId: string) {
        if (!supabase) return [];
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('userId', userId);
        if (error) throw error;
        return data || [];
      },
      async getVisibleToUser(userId: string, userRole: string) {
        if (!supabase) return [];
        if (userRole === 'admin') {
          const { data, error } = await supabase.from('documents').select('*');
          if (error) throw error;
          return data || [];
        }
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .or(`visibility.eq.all,visibility.eq.clients,and(visibility.eq.specific,visibleToUserIds.cs.{${userId}})`);
        if (error) throw error;
        return data || [];
      },
      async create(document) {
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase
          .from('documents')
          .insert(document)
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      async update(id: string, updates: Partial<Document>) {
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase
          .from('documents')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      async delete(id: string) {
        if (!supabase) throw new Error('Supabase not configured');
        const { error } = await supabase.from('documents').delete().eq('id', id);
        if (error) throw error;
      },
    },
    messages: {
      async getAll() {
        if (!supabase) return [];
        const { data, error } = await supabase.from('messages').select('*');
        if (error) throw error;
        return data || [];
      },
      async getById(id: string) {
        if (!supabase) return null;
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data;
      },
      async getByUserId(userId: string) {
        if (!supabase) return [];
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`senderId.eq.${userId},recipientId.eq.${userId}`);
        if (error) throw error;
        return data || [];
      },
      async create(message) {
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase
          .from('messages')
          .insert(message)
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      async markAsRead(id: string) {
        if (!supabase) throw new Error('Supabase not configured');
        const { error } = await supabase
          .from('messages')
          .update({ read: true })
          .eq('id', id);
        if (error) throw error;
      },
      async delete(id: string) {
        if (!supabase) throw new Error('Supabase not configured');
        const { error } = await supabase.from('messages').delete().eq('id', id);
        if (error) throw error;
      },
    },
    settings: {
      async get() {
        if (!supabase) {
          return {
            id: 'default',
            availabilityRules: [],
            emailTemplates: { appointmentConfirmation: '', appointmentReminder: '' },
            updatedAt: new Date().toISOString(),
          };
        }
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .maybeSingle();
        if (error) throw error;
        return data || {
          id: 'default',
          availabilityRules: [],
          emailTemplates: { appointmentConfirmation: '', appointmentReminder: '' },
          updatedAt: new Date().toISOString(),
        };
      },
      async update(updates: Partial<Settings>) {
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase
          .from('settings')
          .upsert({ id: 'default', ...updates })
          .select()
          .single();
        if (error) throw error;
        return data;
      },
    },
    consents: {
      async getAll() {
        if (!supabase) return [];
        const { data, error } = await supabase.from('consents').select('*');
        if (error) throw error;
        return data || [];
      },
      async getByUserId(userId: string) {
        if (!supabase) return [];
        const { data, error } = await supabase
          .from('consents')
          .select('*')
          .eq('userId', userId);
        if (error) throw error;
        return data || [];
      },
      async create(consent) {
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase
          .from('consents')
          .insert(consent)
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      async update(id: string, updates: Partial<Consent>) {
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error} = await supabase
          .from('consents')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      },
    },
    sessions: {
      async getAll() {
        if (!supabase) return [];
        const { data, error } = await supabase.from('sessions').select('*');
        if (error) throw error;
        return data || [];
      },
      async getById(id: string) {
        if (!supabase) return null;
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data;
      },
      async getByClientId(clientId: string) {
        if (!supabase) return [];
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('clientId', clientId)
          .order('date', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      async create(session) {
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase
          .from('sessions')
          .insert(session)
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      async update(id: string, updates: Partial<Session>) {
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase
          .from('sessions')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      async delete(id: string) {
        if (!supabase) throw new Error('Supabase not configured');
        const { error } = await supabase.from('sessions').delete().eq('id', id);
        if (error) throw error;
      },
    },
    prescriptions: {
      async getAll() {
        if (!supabase) return [];
        const { data, error } = await supabase.from('prescriptions').select('*');
        if (error) throw error;
        return data || [];
      },
      async getById(id: string) {
        if (!supabase) return null;
        const { data, error } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data;
      },
      async getByClientId(clientId: string) {
        if (!supabase) return [];
        const { data, error } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('clientId', clientId)
          .order('createdAt', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      async create(prescription) {
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase
          .from('prescriptions')
          .insert(prescription)
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      async update(id: string, updates: Partial<Prescription>) {
        if (!supabase) throw new Error('Supabase not configured');
        const { data, error } = await supabase
          .from('prescriptions')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      async delete(id: string) {
        if (!supabase) throw new Error('Supabase not configured');
        const { error } = await supabase.from('prescriptions').delete().eq('id', id);
        if (error) throw error;
      },
    },
  };
};
