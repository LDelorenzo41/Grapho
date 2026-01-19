/**
 * Service de gestion des disponibilités
 * 
 * Ce service calcule les créneaux disponibles en tenant compte de :
 * - Les horaires d'ouverture (normaux ou exceptionnels)
 * - Les jours fériés nationaux
 * - Les vacances scolaires Zone B
 * - Les jours d'indisponibilité spécifiques
 * - Les rendez-vous déjà pris
 * - Le type de rendez-vous souhaité (30 min ou 60 min)
 */

import {
  APPOINTMENT_TYPES,
  NORMAL_SCHEDULE,
  EXCEPTIONAL_SCHEDULE,
  FRENCH_HOLIDAYS,
  SCHOOL_VACATIONS_ZONE_B,
  BLOCKED_DATES,
  WORKING_DAYS,
  SLOT_DURATION_MINUTES,
  MIN_BOOKING_NOTICE_HOURS,
  CALENDAR_COLORS,
} from './appointmentConfig';

import type {
  AppointmentType,
  DaySchedule,
  TimeRange,
  AvailabilityMode,
} from './appointmentConfig';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Créneau horaire disponible
 */
export interface AvailableSlot {
  date: string;           // Format 'YYYY-MM-DD'
  startTime: string;      // Format 'HH:MM:SS'
  endTime: string;        // Format 'HH:MM:SS'
  isExceptional: boolean; // True si c'est un jour exceptionnel (vacances/férié)
}

/**
 * Informations sur un jour pour le calendrier
 */
export interface DayInfo {
  date: string;
  dayOfWeek: number;
  isWorkingDay: boolean;
  isBlocked: boolean;
  isHoliday: boolean;
  isVacation: boolean;
  availabilityMode: AvailabilityMode;
  schedule: DaySchedule | null;
  color: string;
}

/**
 * Rendez-vous existant (format simplifié pour la vérification)
 */
export interface ExistingAppointment {
  startTime: string; // ISO datetime
  endTime: string;   // ISO datetime
  status: string;
}

// ============================================================================
// FONCTIONS UTILITAIRES DE DATE
// ============================================================================

/**
 * Convertit une date en string 'YYYY-MM-DD'
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse une string 'YYYY-MM-DD' en Date
 */
export function parseStringToDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Convertit 'HH:MM' en minutes depuis minuit
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convertit des minutes depuis minuit en 'HH:MM:SS'
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
}

/**
 * Ajoute des jours à une date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ============================================================================
// FONCTIONS DE VÉRIFICATION DES DATES
// ============================================================================

/**
 * Vérifie si une date est un jour férié
 */
export function isHoliday(dateStr: string): boolean {
  return FRENCH_HOLIDAYS.includes(dateStr);
}

/**
 * Vérifie si une date est pendant les vacances scolaires Zone B
 */
export function isSchoolVacation(dateStr: string): boolean {
  const date = parseStringToDate(dateStr);
  
  return SCHOOL_VACATIONS_ZONE_B.some(vacation => {
    const start = parseStringToDate(vacation.start);
    const end = parseStringToDate(vacation.end);
    return date >= start && date <= end;
  });
}

/**
 * Vérifie si une date est un jour bloqué (indisponibilité totale)
 */
export function isBlockedDate(dateStr: string): boolean {
  return BLOCKED_DATES.includes(dateStr);
}

/**
 * Vérifie si une date est un jour ouvré (Mercredi, Jeudi ou Samedi)
 */
export function isWorkingDay(dayOfWeek: number): boolean {
  return dayOfWeek === WORKING_DAYS.WEDNESDAY ||
         dayOfWeek === WORKING_DAYS.THURSDAY ||
         dayOfWeek === WORKING_DAYS.SATURDAY;
}

/**
 * Détermine le mode de disponibilité pour une date
 * 'exceptional' si jour férié OU vacances scolaires
 * 'normal' sinon
 */
export function getAvailabilityMode(dateStr: string): AvailabilityMode {
  if (isHoliday(dateStr) || isSchoolVacation(dateStr)) {
    return 'exceptional';
  }
  return 'normal';
}

/**
 * Récupère les horaires pour un jour et un mode donnés
 */
export function getScheduleForDay(
  dayOfWeek: number,
  mode: AvailabilityMode
): DaySchedule | null {
  if (!isWorkingDay(dayOfWeek)) {
    return null;
  }
  
  const schedule = mode === 'exceptional' 
    ? EXCEPTIONAL_SCHEDULE[dayOfWeek] 
    : NORMAL_SCHEDULE[dayOfWeek];
    
  return schedule || null;
}

// ============================================================================
// FONCTION PRINCIPALE : INFORMATIONS SUR UN JOUR
// ============================================================================

/**
 * Récupère toutes les informations sur un jour donné
 */
export function getDayInfo(dateStr: string): DayInfo {
  const date = parseStringToDate(dateStr);
  const dayOfWeek = date.getDay();
  const working = isWorkingDay(dayOfWeek);
  const blocked = isBlockedDate(dateStr);
  const holiday = isHoliday(dateStr);
  const vacation = isSchoolVacation(dateStr);
  const mode = getAvailabilityMode(dateStr);
  
  // Déterminer la couleur du jour
  let color: string = CALENDAR_COLORS.background;
  if (blocked) {
    color = CALENDAR_COLORS.unavailable;
  } else if (working) {
    color = CALENDAR_COLORS.available;
  }
  
  return {
    date: dateStr,
    dayOfWeek,
    isWorkingDay: working,
    isBlocked: blocked,
    isHoliday: holiday,
    isVacation: vacation,
    availabilityMode: mode,
    schedule: blocked ? null : getScheduleForDay(dayOfWeek, mode),
    color,
  };
}

// ============================================================================
// GÉNÉRATION DES CRÉNEAUX
// ============================================================================

/**
 * Génère tous les créneaux de 30 minutes pour une plage horaire
 */
function generateSlotsForTimeRange(
  dateStr: string,
  timeRange: TimeRange,
  isExceptional: boolean
): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  const startMinutes = timeToMinutes(timeRange.start);
  const endMinutes = timeToMinutes(timeRange.end);
  
  // Générer des créneaux de 30 minutes
  for (let mins = startMinutes; mins + SLOT_DURATION_MINUTES <= endMinutes; mins += SLOT_DURATION_MINUTES) {
    slots.push({
      date: dateStr,
      startTime: minutesToTime(mins),
      endTime: minutesToTime(mins + SLOT_DURATION_MINUTES),
      isExceptional,
    });
  }
  
  return slots;
}

/**
 * Génère tous les créneaux de base pour un jour
 * (sans vérification des conflits)
 */
export function generateBaseSlotsForDay(dateStr: string): AvailableSlot[] {
  const dayInfo = getDayInfo(dateStr);
  
  // Jour non travaillé ou bloqué : pas de créneaux
  if (!dayInfo.isWorkingDay || dayInfo.isBlocked || !dayInfo.schedule) {
    return [];
  }
  
  const slots: AvailableSlot[] = [];
  const isExceptional = dayInfo.availabilityMode === 'exceptional';
  
  // Créneaux du matin
  if (dayInfo.schedule.morning) {
    slots.push(...generateSlotsForTimeRange(dateStr, dayInfo.schedule.morning, isExceptional));
  }
  
  // Créneaux de l'après-midi
  if (dayInfo.schedule.afternoon) {
    slots.push(...generateSlotsForTimeRange(dateStr, dayInfo.schedule.afternoon, isExceptional));
  }
  
  return slots;
}

// ============================================================================
// VÉRIFICATION DES CONFLITS
// ============================================================================

/**
 * Vérifie si deux plages horaires se chevauchent
 */
function hasTimeConflict(
  slot: { date: string; startTime: string; endTime: string },
  appointment: ExistingAppointment
): boolean {
  // Construire les dates complètes pour comparaison
  const slotStart = new Date(`${slot.date}T${slot.startTime}`);
  const slotEnd = new Date(`${slot.date}T${slot.endTime}`);
  const aptStart = new Date(appointment.startTime);
  const aptEnd = new Date(appointment.endTime);
  
  // Vérifier le chevauchement
  return (
    (slotStart >= aptStart && slotStart < aptEnd) ||
    (slotEnd > aptStart && slotEnd <= aptEnd) ||
    (slotStart <= aptStart && slotEnd >= aptEnd)
  );
}

/**
 * Filtre les créneaux en retirant ceux en conflit avec des RDV existants
 */
export function filterConflictingSlots(
  slots: AvailableSlot[],
  appointments: ExistingAppointment[]
): AvailableSlot[] {
  // Ne considérer que les RDV non annulés
  const activeAppointments = appointments.filter(apt => apt.status !== 'cancelled');
  
  return slots.filter(slot => {
    return !activeAppointments.some(apt => hasTimeConflict(slot, apt));
  });
}

/**
 * Filtre les créneaux passés (incluant le délai minimum de réservation)
 */
export function filterPastSlots(slots: AvailableSlot[]): AvailableSlot[] {
  const now = new Date();
  const minBookingTime = new Date(now.getTime() + MIN_BOOKING_NOTICE_HOURS * 60 * 60 * 1000);
  
  return slots.filter(slot => {
    const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
    return slotDateTime > minBookingTime;
  });
}

// ============================================================================
// VÉRIFICATION POUR TYPE DE RDV
// ============================================================================

/**
 * Vérifie si un créneau permet de réserver un type de RDV spécifique
 * 
 * Pour un RDV de 60 min (remediation), vérifie que le créneau suivant
 * de 30 min est également disponible ET dans les horaires d'ouverture
 */
export function canBookAppointmentType(
  slot: AvailableSlot,
  appointmentType: AppointmentType,
  allAvailableSlots: AvailableSlot[]
): boolean {
  const config = APPOINTMENT_TYPES[appointmentType];
  
  // Type non réservable en ligne
  if (!config.bookableOnline) {
    return false;
  }
  
  // Pour un RDV de 30 min, le créneau suffit
  if (config.slots === 1) {
    return true;
  }
  
  // Pour un RDV de 60 min, vérifier le créneau suivant
  if (config.slots === 2) {
    const slotEndTime = slot.endTime;
    
    // Chercher un créneau qui commence à la fin de celui-ci
    const nextSlot = allAvailableSlots.find(s => 
      s.date === slot.date && s.startTime === slotEndTime
    );
    
    return nextSlot !== undefined;
  }
  
  return false;
}

/**
 * Filtre les créneaux valides pour un type de RDV donné
 */
export function filterSlotsForAppointmentType(
  slots: AvailableSlot[],
  appointmentType: AppointmentType
): AvailableSlot[] {
  return slots.filter(slot => canBookAppointmentType(slot, appointmentType, slots));
}

// ============================================================================
// FONCTION PRINCIPALE : RÉCUPÉRER LES CRÉNEAUX DISPONIBLES
// ============================================================================

/**
 * Récupère tous les créneaux disponibles pour une période et un type de RDV
 * 
 * @param startDate - Date de début (YYYY-MM-DD)
 * @param endDate - Date de fin (YYYY-MM-DD)
 * @param appointments - Liste des RDV existants
 * @param appointmentType - Type de RDV souhaité (optionnel, par défaut tous)
 * @returns Liste des créneaux disponibles
 */
export function getAvailableSlots(
  startDate: string,
  endDate: string,
  appointments: ExistingAppointment[],
  appointmentType?: AppointmentType
): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  
  // Générer les dates de la période
  let currentDate = parseStringToDate(startDate);
  const end = parseStringToDate(endDate);
  
  while (currentDate <= end) {
    const dateStr = formatDateToString(currentDate);
    
    // Générer les créneaux de base pour ce jour
    const daySlots = generateBaseSlotsForDay(dateStr);
    slots.push(...daySlots);
    
    currentDate = addDays(currentDate, 1);
  }
  
  // Filtrer les créneaux en conflit avec des RDV existants
  let availableSlots = filterConflictingSlots(slots, appointments);
  
  // Filtrer les créneaux passés
  availableSlots = filterPastSlots(availableSlots);
  
  // Si un type de RDV est spécifié, filtrer selon les besoins
  if (appointmentType) {
    availableSlots = filterSlotsForAppointmentType(availableSlots, appointmentType);
  }
  
  return availableSlots;
}

// ============================================================================
// FONCTIONS D'AFFICHAGE POUR LE CALENDRIER
// ============================================================================

/**
 * Récupère les informations de tous les jours d'une période
 * Utile pour afficher le calendrier avec les bonnes couleurs
 */
export function getDaysInfoForPeriod(startDate: string, endDate: string): DayInfo[] {
  const days: DayInfo[] = [];
  
  let currentDate = parseStringToDate(startDate);
  const end = parseStringToDate(endDate);
  
  while (currentDate <= end) {
    const dateStr = formatDateToString(currentDate);
    days.push(getDayInfo(dateStr));
    currentDate = addDays(currentDate, 1);
  }
  
  return days;
}

/**
 * Vérifie si une date donnée a des créneaux disponibles
 */
export function hasAvailableSlotsOnDate(
  dateStr: string,
  appointments: ExistingAppointment[],
  appointmentType?: AppointmentType
): boolean {
  const slots = getAvailableSlots(dateStr, dateStr, appointments, appointmentType);
  return slots.length > 0;
}

/**
 * Compte le nombre de créneaux disponibles pour une date
 */
export function countAvailableSlotsOnDate(
  dateStr: string,
  appointments: ExistingAppointment[],
  appointmentType?: AppointmentType
): number {
  const slots = getAvailableSlots(dateStr, dateStr, appointments, appointmentType);
  return slots.length;
}

