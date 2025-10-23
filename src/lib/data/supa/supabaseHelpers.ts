// Helper pour convertir entre camelCase (JavaScript) et snake_case (PostgreSQL)

import type { User, Appointment, Message } from '../types';

// ============================================
// USER CONVERSIONS
// ============================================

// Convertir camelCase vers snake_case pour l'insertion dans Supabase
export function userToSnakeCase(user: any): any {
  const { firstName, lastName, dateOfBirth, createdAt, updatedAt, ...rest } = user;
  return {
    ...rest,
    ...(firstName !== undefined && { first_name: firstName }),
    ...(lastName !== undefined && { last_name: lastName }),
    ...(dateOfBirth !== undefined && { date_of_birth: dateOfBirth }),
    ...(createdAt !== undefined && { created_at: createdAt }),
    ...(updatedAt !== undefined && { updated_at: updatedAt }),
  };
}

// Convertir snake_case vers camelCase pour le retour depuis Supabase
export function userFromSnakeCase(data: any): User {
  return {
    id: data.id,
    email: data.email,
    role: data.role,
    firstName: data.first_name,
    lastName: data.last_name,
    phone: data.phone,
    dateOfBirth: data.date_of_birth,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// ============================================
// APPOINTMENT CONVERSIONS
// ============================================

// Convertir camelCase vers snake_case pour l'insertion dans Supabase
export function appointmentToSnakeCase(appointment: any): any {
  const { clientId, startTime, endTime, createdAt, updatedAt, ...rest } = appointment;
  return {
    ...rest,
    ...(clientId !== undefined && { client_id: clientId }),
    ...(startTime !== undefined && { start_time: startTime }),
    ...(endTime !== undefined && { end_time: endTime }),
    ...(createdAt !== undefined && { created_at: createdAt }),
    ...(updatedAt !== undefined && { updated_at: updatedAt }),
  };
}

// Convertir snake_case vers camelCase pour le retour depuis Supabase
export function appointmentFromSnakeCase(data: any): Appointment {
  return {
    id: data.id,
    clientId: data.client_id,
    startTime: data.start_time,
    endTime: data.end_time,
    status: data.status,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// ============================================
// MESSAGE CONVERSIONS
// ============================================

// Convertir camelCase vers snake_case pour l'insertion dans Supabase
export function messageToSnakeCase(message: any): any {
  const { senderId, recipientId, createdAt, ...rest } = message;
  return {
    ...rest,
    ...(senderId !== undefined && { sender_id: senderId }),
    ...(recipientId !== undefined && { recipient_id: recipientId }),
    ...(createdAt !== undefined && { created_at: createdAt }),
  };
}

// Convertir snake_case vers camelCase pour le retour depuis Supabase
export function messageFromSnakeCase(data: any): Message {
  return {
    id: data.id,
    senderId: data.sender_id,
    recipientId: data.recipient_id,
    subject: data.subject,
    content: data.content,
    read: data.read,
    sentAt: data.sent_at || data.created_at,
  };
}