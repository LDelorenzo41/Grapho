import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { DataAdapter, CreateUserInput } from '../ports';
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
} from '../types';
import {
  userToSnakeCase,
  userFromSnakeCase,
  appointmentToSnakeCase,
  appointmentFromSnakeCase,
  messageToSnakeCase,
  messageFromSnakeCase,
  documentToSnakeCase,
  documentFromSnakeCase
} from './supabaseHelpers';

const getSupabaseClient = (): SupabaseClient | null => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn('Supabase credentials not configured');
    return null;
  }

  return createClient(url, anonKey);
};

export const createSupabaseAdapter = (): DataAdapter => {
  const supabase = getSupabaseClient();

  return {
    users: {
      async getAll() {
        if (!supabase) return [];
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        return (data || []).map(userFromSnakeCase);
      },
      async getById(id: string) {
        if (!supabase) return null;
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data ? userFromSnakeCase(data) : null;
      },
      async getByEmail(email: string) {
        if (!supabase) return null;
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .maybeSingle();
        if (error) throw error;
        return data ? userFromSnakeCase(data) : null;
      },
      async create(user: CreateUserInput) {
        if (!supabase) throw new Error('Supabase not configured');
        
        try {
          // 1. Créer le compte d'authentification Supabase si un mot de passe est fourni
          let authUserId: string;
          
          if (user.password) {
            const { data: authData, error: authError } = await supabase.auth.signUp({
              email: user.email,
              password: user.password,
              options: {
                data: {
                  first_name: user.firstName,
                  last_name: user.lastName,
                },
                emailRedirectTo: undefined, // Pas de redirection email pour le moment
              }
            });
            
            if (authError) {
              console.error('Auth error:', authError);
              throw authError;
            }
            if (!authData.user) throw new Error('Failed to create auth user');
            
            authUserId = authData.user.id;
          } else {
            // Mode legacy : générer un ID aléatoire si pas de mot de passe
            authUserId = crypto.randomUUID();
          }
          
          // 2. Créer l'entrée dans la table users (sans le mot de passe)
          const { password, ...userWithoutPassword } = user;
          const dbUser = userToSnakeCase({ ...userWithoutPassword, id: authUserId });
          
          const { data, error } = await supabase
            .from('users')
            .insert(dbUser)
            .select()
            .single();
            
          if (error) {
            console.error('Database error:', error);
            throw error;
          }
          
          // Convertir le résultat de snake_case vers camelCase
          return userFromSnakeCase(data);
        } catch (error) {
          console.error('Error creating user:', error);
          throw error;
        }
      },
      async update(id: string, updates: Partial<User>) {
        if (!supabase) throw new Error('Supabase not configured');
        
        // 1. Vérifier l'utilisateur authentifié
        const { data: { user: authUser } } = await supabase.auth.getUser();
        console.log('🔍 Auth user ID:', authUser?.id);
        console.log('🔍 Auth user email:', authUser?.email);
        
        const dbUpdates = userToSnakeCase(updates);
        console.log('🔍 UPDATE payload:', dbUpdates);
        console.log('🔍 Target user ID:', id);
        
        // 2. Tenter l'UPDATE sans .single() pour voir le résultat brut
        const { data, error, count } = await supabase
          .from('users')
          .update(dbUpdates)
          .eq('id', id)
          .select();
        
        console.log('🔍 UPDATE result:', { data, error, count, rowCount: data?.length });
        
        if (error) {
          console.error('❌ Supabase error:', error);
          throw error;
        }
        
        if (!data || data.length === 0) {
          // 3. Diagnostiquer pourquoi aucune ligne n'est retournée
          console.error('❌ No rows returned. Checking diagnostics...');
          
          // Vérifier si l'utilisateur existe
          const { data: checkUser } = await supabase
            .from('users')
            .select('id, email, role')
            .eq('id', id)
            .maybeSingle();
          
          console.log('🔍 Target user exists:', checkUser);
          
          // Vérifier le rôle de l'utilisateur authentifié
          const { data: authUserData } = await supabase
            .from('users')
            .select('id, email, role')
            .eq('id', authUser?.id)
            .maybeSingle();
          
          console.log('🔍 Auth user data:', authUserData);
          
          throw new Error(
            `Update failed: No rows returned. ` +
            `Auth user: ${authUserData?.email} (${authUserData?.role}). ` +
            `Target user: ${checkUser?.email}. ` +
            `Check RLS policies.`
          );
        }
        
        return userFromSnakeCase(data[0]);
      },
      async delete(id: string) {
        if (!supabase) throw new Error('Supabase not configured');
        
        console.log('🗑️ Appel de l\'Edge Function pour supprimer l\'utilisateur:', id);
        
        try {
          // Appeler l'Edge Function sécurisée
          const { data, error } = await supabase.functions.invoke('delete-user-admin', {
            body: { userId: id }
          });
          
          if (error) {
            console.error('❌ Erreur Edge Function:', error);
            
            // Messages d'erreur plus explicites
            if (error.message?.includes('Forbidden')) {
              throw new Error('Vous n\'avez pas les droits administrateur pour supprimer cet utilisateur');
            } else if (error.message?.includes('Cannot delete your own account')) {
              throw new Error('Vous ne pouvez pas supprimer votre propre compte');
            } else {
              throw new Error(`Erreur lors de la suppression : ${error.message}`);
            }
          }
          
          if (!data?.success) {
            console.error('❌ Suppression échouée:', data);
            throw new Error('La suppression a échoué');
          }
          
          console.log('✅ Utilisateur supprimé avec succès:', data);
        } catch (error: any) {
          console.error('❌ Erreur lors de la suppression:', error);
          throw error;
        }
      },
    },
    appointments: {
      async getAll() {
        if (!supabase) return [];
        const { data, error } = await supabase.from('appointments').select('*');
        if (error) throw error;
        return (data || []).map(appointmentFromSnakeCase);
      },
      async getById(id: string) {
        if (!supabase) return null;
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data ? appointmentFromSnakeCase(data) : null;
      },
      async getByClientId(clientId: string) {
        if (!supabase) return [];
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('client_id', clientId); // ← Utiliser snake_case pour la requête
        if (error) throw error;
        return (data || []).map(appointmentFromSnakeCase);
      },
      async getAvailableSlots(startDate: string, endDate: string): Promise<AvailableSlot[]> {
        if (!supabase) return [];

        // Charger les availability_rules depuis leur table dédiée
        const { data: rulesData, error: rulesError } = await supabase
          .from('availability_rules')
          .select('*')
          .eq('is_active', true);
        if (rulesError) throw rulesError;
        if (!rulesData || rulesData.length === 0) return [];

        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*');
        if (appointmentsError) throw appointmentsError;

        const slots: AvailableSlot[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
          const dayOfWeek = date.getDay();
          const dateStr = date.toISOString().split('T')[0];

          const rules = rulesData.filter(rule => rule.day_of_week === dayOfWeek);

          for (const rule of rules) {
            const startHour = parseInt(rule.start_time.split(':')[0]);
            const endHour = parseInt(rule.end_time.split(':')[0]);

            for (let hour = startHour; hour < endHour; hour++) {
              const slotStart = `${hour.toString().padStart(2, '0')}:00:00`;
              const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00:00`;

              const slotStartTime = new Date(`${dateStr}T${slotStart}`).toISOString();
              const slotEndTime = new Date(`${dateStr}T${slotEnd}`).toISOString();

              const isBooked = appointmentsData?.some(apt => {
                const aptStart = new Date(apt.start_time);
                const aptEnd = new Date(apt.end_time);
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
        const dbAppointment = appointmentToSnakeCase(appointment);
        const { data, error } = await supabase
          .from('appointments')
          .insert(dbAppointment)
          .select()
          .single();
        if (error) throw error;
        return appointmentFromSnakeCase(data);
      },
      async update(id: string, updates: Partial<Appointment>) {
        if (!supabase) throw new Error('Supabase not configured');
        const dbUpdates = appointmentToSnakeCase(updates);
        const { data, error } = await supabase
          .from('appointments')
          .update(dbUpdates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return appointmentFromSnakeCase(data);
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
    return (data || []).map(documentFromSnakeCase);
  },
  async getById(id: string) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? documentFromSnakeCase(data) : null;
  },
  async getByUserId(userId: string) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data || []).map(documentFromSnakeCase);
  },
  async getVisibleToUser(userId: string, userRole: string) {
    if (!supabase) return [];
    if (userRole === 'admin') {
      const { data, error } = await supabase.from('documents').select('*');
      if (error) throw error;
      return (data || []).map(documentFromSnakeCase);
    }
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .or(`visibility.eq.all,visibility.eq.clients,and(visibility.eq.specific,visible_to_user_ids.cs.{${userId}})`);
    if (error) throw error;
    return (data || []).map(documentFromSnakeCase);
  },
  async create(document) {
    if (!supabase) throw new Error('Supabase not configured');
    const dbDocument = documentToSnakeCase(document);
    const { data, error } = await supabase
      .from('documents')
      .insert(dbDocument)
      .select()
      .single();
    if (error) throw error;
    return documentFromSnakeCase(data);
  },
  async update(id: string, updates: Partial<Document>) {
    if (!supabase) throw new Error('Supabase not configured');
    const dbUpdates = documentToSnakeCase(updates);
    const { data, error } = await supabase
      .from('documents')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return documentFromSnakeCase(data);
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
        return (data || []).map(messageFromSnakeCase);
      },
      async getById(id: string) {
        if (!supabase) return null;
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data ? messageFromSnakeCase(data) : null;
      },
      async getByUserId(userId: string) {
        if (!supabase) return [];
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
        if (error) throw error;
        return (data || []).map(messageFromSnakeCase);
      },
      async create(message) {
        if (!supabase) throw new Error('Supabase not configured');
        const dbMessage = messageToSnakeCase(message);
        const { data, error } = await supabase
          .from('messages')
          .insert(dbMessage)
          .select()
          .single();
        if (error) throw error;
        return messageFromSnakeCase(data);
      },
      async update(id: string, updates: Partial<Message>) {
        if (!supabase) throw new Error('Supabase not configured');
        const dbUpdates = messageToSnakeCase(updates as any);
        const { data, error } = await supabase
          .from('messages')
          .update(dbUpdates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return messageFromSnakeCase(data);
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
            emailTemplates: { 
              appointmentConfirmation: 'Votre rendez-vous est confirmé.', 
              appointmentReminder: 'Rappel de votre rendez-vous.' 
            },
            updatedAt: new Date().toISOString(),
          };
        }
        
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .maybeSingle();
          
        if (error) throw error;
        
        if (!data) {
          return {
            id: 'default',
            availabilityRules: [],
            emailTemplates: { 
              appointmentConfirmation: 'Votre rendez-vous est confirmé.', 
              appointmentReminder: 'Rappel de votre rendez-vous.' 
            },
            updatedAt: new Date().toISOString(),
          };
        }
        
        // ✅ TRANSFORMATION : Convertir de snake_case (DB) vers camelCase (TypeScript)
        return {
          id: data.id,
          availabilityRules: data.availability_rules || [],
          emailTemplates: data.email_templates || {
            appointmentConfirmation: data.email_template_appointment_confirmation || '',
            appointmentReminder: data.email_template_appointment_reminder || '',
          },
          updatedAt: data.updated_at,
        };
      },
      
      async update(updates: Partial<Settings>) {
        if (!supabase) throw new Error('Supabase not configured');
        
        // ✅ TRANSFORMATION : Convertir de camelCase (TypeScript) vers snake_case (DB)
        const dbUpdates: any = {
          updated_at: new Date().toISOString(),
        };
        
        if (updates.availabilityRules !== undefined) {
          dbUpdates.availability_rules = updates.availabilityRules;
        }
        
        if (updates.emailTemplates !== undefined) {
          dbUpdates.email_templates = updates.emailTemplates;
        }
        
        // Récupérer l'ID existant ou utiliser celui fourni
        const { data: existing } = await supabase
          .from('settings')
          .select('id')
          .maybeSingle();
        
        const settingsId = existing?.id || updates.id || '42e47c99-cf09-4cf6-84ae-dfc9e417c0d9';
        
        const { data, error } = await supabase
          .from('settings')
          .upsert({ id: settingsId, ...dbUpdates })
          .select()
          .single();
          
        if (error) throw error;
        
        // ✅ TRANSFORMATION : Retourner au format camelCase
        return {
          id: data.id,
          availabilityRules: data.availability_rules || [],
          emailTemplates: data.email_templates || {
            appointmentConfirmation: '',
            appointmentReminder: '',
          },
          updatedAt: data.updated_at,
        };
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
          .eq('user_id', userId)
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
        // Conversion snake_case → camelCase
        return (data || []).map(s => ({
          id: s.id,
          clientId: s.client_id,
          appointmentId: s.appointment_id,
          date: s.date,
          duration: s.duration,
          sessionNumber: s.session_number,
          summary: s.summary,
          progress: s.progress,
          objectives: s.objectives,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }));
      },
      async getById(id: string) {
        if (!supabase) return null;
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        // Conversion snake_case → camelCase
        return {
          id: data.id,
          clientId: data.client_id,
          appointmentId: data.appointment_id,
          date: data.date,
          duration: data.duration,
          sessionNumber: data.session_number,
          summary: data.summary,
          progress: data.progress,
          objectives: data.objectives,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      },
      async getByClientId(clientId: string) {
        if (!supabase) return [];
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('client_id', clientId)
          .order('date', { ascending: false });
        if (error) throw error;
        // Conversion snake_case → camelCase
        return (data || []).map(s => ({
          id: s.id,
          clientId: s.client_id,
          appointmentId: s.appointment_id,
          date: s.date,
          duration: s.duration,
          sessionNumber: s.session_number,
          summary: s.summary,
          progress: s.progress,
          objectives: s.objectives,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }));
      },
      async create(session) {
        if (!supabase) throw new Error('Supabase not configured');
        
        // Conversion camelCase → snake_case pour l'insertion
        const dbSession: any = {
          client_id: session.clientId,
          date: session.date,
          duration: session.duration,
          session_number: session.sessionNumber,
          summary: session.summary,
          progress: session.progress,
        };
        
        // Champs optionnels
        if (session.appointmentId) dbSession.appointment_id = session.appointmentId;
        if (session.objectives) dbSession.objectives = session.objectives;
        
        const { data, error } = await supabase
          .from('sessions')
          .insert(dbSession)
          .select()
          .single();
        if (error) throw error;
        
        // Conversion snake_case → camelCase pour le retour
        return {
          id: data.id,
          clientId: data.client_id,
          appointmentId: data.appointment_id,
          date: data.date,
          duration: data.duration,
          sessionNumber: data.session_number,
          summary: data.summary,
          progress: data.progress,
          objectives: data.objectives,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      },
      async update(id: string, updates: Partial<Session>) {
        if (!supabase) throw new Error('Supabase not configured');
        
        // Conversion camelCase → snake_case pour la mise à jour
        const dbUpdates: any = {};
        if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
        if (updates.appointmentId !== undefined) dbUpdates.appointment_id = updates.appointmentId;
        if (updates.date !== undefined) dbUpdates.date = updates.date;
        if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
        if (updates.sessionNumber !== undefined) dbUpdates.session_number = updates.sessionNumber;
        if (updates.summary !== undefined) dbUpdates.summary = updates.summary;
        if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
        if (updates.objectives !== undefined) dbUpdates.objectives = updates.objectives;
        
        const { data, error } = await supabase
          .from('sessions')
          .update(dbUpdates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        
        // Conversion snake_case → camelCase pour le retour
        return {
          id: data.id,
          clientId: data.client_id,
          appointmentId: data.appointment_id,
          date: data.date,
          duration: data.duration,
          sessionNumber: data.session_number,
          summary: data.summary,
          progress: data.progress,
          objectives: data.objectives,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
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
        // Conversion snake_case → camelCase
        return (data || []).map(p => ({
          id: p.id,
          clientId: p.client_id,
          sessionId: p.session_id,
          title: p.title,
          description: p.description,
          exercises: p.exercises,
          frequency: p.frequency,
          duration: p.duration,
          createdAt: p.created_at,
        }));
      },
      async getById(id: string) {
        if (!supabase) return null;
        const { data, error } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        // Conversion snake_case → camelCase
        return {
          id: data.id,
          clientId: data.client_id,
          sessionId: data.session_id,
          title: data.title,
          description: data.description,
          exercises: data.exercises,
          frequency: data.frequency,
          duration: data.duration,
          createdAt: data.created_at,
        };
      },
      async getByClientId(clientId: string) {
        if (!supabase) return [];
        const { data, error } = await supabase
          .from('prescriptions')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        // Conversion snake_case → camelCase
        return (data || []).map(p => ({
          id: p.id,
          clientId: p.client_id,
          sessionId: p.session_id,
          title: p.title,
          description: p.description,
          exercises: p.exercises,
          frequency: p.frequency,
          duration: p.duration,
          createdAt: p.created_at,
        }));
      },
      async create(prescription) {
        if (!supabase) throw new Error('Supabase not configured');
        
        // Conversion camelCase → snake_case pour l'insertion
        const dbPrescription: any = {
          client_id: prescription.clientId,
          title: prescription.title,
          description: prescription.description,
          exercises: prescription.exercises,
        };
        
        // Champs optionnels
        if (prescription.sessionId) dbPrescription.session_id = prescription.sessionId;
        if (prescription.frequency) dbPrescription.frequency = prescription.frequency;
        if (prescription.duration) dbPrescription.duration = prescription.duration;
        
        const { data, error } = await supabase
          .from('prescriptions')
          .insert(dbPrescription)
          .select()
          .single();
        if (error) throw error;
        
        // Conversion snake_case → camelCase pour le retour
        return {
          id: data.id,
          clientId: data.client_id,
          sessionId: data.session_id,
          title: data.title,
          description: data.description,
          exercises: data.exercises,
          frequency: data.frequency,
          duration: data.duration,
          createdAt: data.created_at,
        };
      },
      async update(id: string, updates: Partial<Prescription>) {
        if (!supabase) throw new Error('Supabase not configured');
        
        // Conversion camelCase → snake_case pour la mise à jour
        const dbUpdates: any = {};
        if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
        if (updates.sessionId !== undefined) dbUpdates.session_id = updates.sessionId;
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.exercises !== undefined) dbUpdates.exercises = updates.exercises;
        if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
        if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
        
        const { data, error } = await supabase
          .from('prescriptions')
          .update(dbUpdates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        
        // Conversion snake_case → camelCase pour le retour
        return {
          id: data.id,
          clientId: data.client_id,
          sessionId: data.session_id,
          title: data.title,
          description: data.description,
          exercises: data.exercises,
          frequency: data.frequency,
          duration: data.duration,
          createdAt: data.created_at,
        };
      },
      async delete(id: string) {
        if (!supabase) throw new Error('Supabase not configured');
        const { error } = await supabase.from('prescriptions').delete().eq('id', id);
        if (error) throw error;
      },
    },
    availabilityRules: {
      async getAll() {
        if (!supabase) return [];
        const { data, error } = await supabase
          .from('availability_rules')
          .select('*')
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true });
        if (error) throw error;
        
        // Convertir snake_case en camelCase
        return (data || []).map(rule => ({
          id: rule.id,
          dayOfWeek: rule.day_of_week,
          startTime: rule.start_time,
          endTime: rule.end_time,
          isActive: rule.is_active,
        }));
      },
      async getById(id: string) {
        if (!supabase) return null;
        const { data, error } = await supabase
          .from('availability_rules')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        
        // Convertir snake_case en camelCase
        return {
          id: data.id,
          dayOfWeek: data.day_of_week,
          startTime: data.start_time,
          endTime: data.end_time,
          isActive: data.is_active,
        };
      },
      async create(rule) {
        if (!supabase) throw new Error('Supabase not configured');
        
        // Convertir camelCase en snake_case pour Supabase
        const dbRule = {
          day_of_week: rule.dayOfWeek,
          start_time: rule.startTime,
          end_time: rule.endTime,
          is_active: rule.isActive,
        };
        
        const { data, error } = await supabase
          .from('availability_rules')
          .insert(dbRule)
          .select()
          .single();
        if (error) throw error;
        
        // Convertir snake_case en camelCase pour le retour
        return {
          id: data.id,
          dayOfWeek: data.day_of_week,
          startTime: data.start_time,
          endTime: data.end_time,
          isActive: data.is_active,
        };
      },
      async update(id: string, updates) {
        if (!supabase) throw new Error('Supabase not configured');
        
        // Convertir camelCase en snake_case pour Supabase
        const dbUpdates: any = {};
        if (updates.dayOfWeek !== undefined) dbUpdates.day_of_week = updates.dayOfWeek;
        if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
        if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
        
        const { data, error } = await supabase
          .from('availability_rules')
          .update(dbUpdates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        
        // Convertir snake_case en camelCase pour le retour
        return {
          id: data.id,
          dayOfWeek: data.day_of_week,
          startTime: data.start_time,
          endTime: data.end_time,
          isActive: data.is_active,
        };
      },
      async delete(id: string) {
        if (!supabase) throw new Error('Supabase not configured');
        const { error } = await supabase
          .from('availability_rules')
          .delete()
          .eq('id', id);
        if (error) throw error;
      },
    },
  };
};
