/**
 * Configuration du système de rendez-vous Grapho
 * 
 * Ce fichier centralise toute la configuration des rendez-vous :
 * - Types de rendez-vous et durées
 * - Codes couleurs pour l'interface
 * - Horaires d'ouverture (normaux et exceptionnels)
 * - Jours fériés nationaux français
 * - Vacances scolaires Zone B
 * - Jours d'indisponibilité spécifiques
 * 
 * Validité : Jusqu'en septembre 2026
 */

// ============================================================================
// TYPES DE RENDEZ-VOUS
// ============================================================================

/**
 * Types de rendez-vous disponibles
 * - 'premier_rdv' : Premier rendez-vous / Rencontre (30 min) - Réservable en ligne
 * - 'remediation' : Séance de remédiation / bien-être (60 min) - Réservable en ligne
 * - 'bilan' : Bilan complet - NON réservable en ligne (pris lors du 1er RDV)
 */
export type AppointmentType = 'premier_rdv' | 'remediation' | 'bilan';

export interface AppointmentTypeConfig {
  id: AppointmentType;
  label: string;
  labelShort: string;
  duration: number; // en minutes
  slots: number; // nombre de créneaux de 30 min nécessaires
  bookableOnline: boolean;
  description: string;
}

export const APPOINTMENT_TYPES: Record<AppointmentType, AppointmentTypeConfig> = {
  premier_rdv: {
    id: 'premier_rdv',
    label: 'Premier rendez-vous',
    labelShort: '1er RDV',
    duration: 30,
    slots: 1,
    bookableOnline: true,
    description: 'Première rencontre pour faire connaissance et définir vos besoins.',
  },
  remediation: {
    id: 'remediation',
    label: 'Séance de remédiation',
    labelShort: 'Séance',
    duration: 60,
    slots: 2,
    bookableOnline: true,
    description: 'Séance de remédiation cognitive ou de bien-être (1 heure).',
  },
  bilan: {
    id: 'bilan',
    label: 'Bilan complet',
    labelShort: 'Bilan',
    duration: 0, // Variable, géré en cabinet
    slots: 0,
    bookableOnline: false,
    description: 'Bilan complet - Prise de rendez-vous lors de la première rencontre.',
  },
};

// Liste des types réservables en ligne
export const ONLINE_BOOKABLE_TYPES: AppointmentType[] = ['premier_rdv', 'remediation'];

// ============================================================================
// CODES COULEURS
// ============================================================================

export const CALENDAR_COLORS = {
  // Couleur principale - Créneaux disponibles
  available: '#8FA382' as string, // Vert Sauge
  
  // Couleur secondaire - Accent
  accent: '#E5B7A4' as string, // Rose Poudré
  
  // Couleur d'indisponibilité - Jours fermés/exceptions
  unavailable: '#C68664' as string, // Terra Cotta
  
  // Couleur de fond - Neutre
  background: '#E2E0D1' as string, // Crème
  
  // Couleurs additionnelles pour les états
  selected: '#6B8E5A' as string, // Vert Sauge foncé (sélection)
  hover: '#A3B896' as string, // Vert Sauge clair (survol)
  past: '#D1D1C7' as string, // Gris clair (passé)
};

// Classes Tailwind correspondantes (pour usage direct)
export const CALENDAR_TAILWIND = {
  available: 'bg-[#8FA382] hover:bg-[#7A9070] text-white',
  availableLight: 'bg-[#8FA382]/10 text-[#8FA382] hover:bg-[#8FA382] hover:text-white',
  accent: 'bg-[#E5B7A4] text-white',
  accentLight: 'bg-[#E5B7A4]/10 text-[#E5B7A4]',
  unavailable: 'bg-[#C68664] text-white',
  unavailableLight: 'bg-[#C68664]/10 text-[#C68664]',
  background: 'bg-[#E2E0D1]',
  selected: 'bg-[#6B8E5A] text-white ring-2 ring-[#6B8E5A] ring-offset-2',
  past: 'bg-gray-100 text-gray-400 cursor-not-allowed',
};

// ============================================================================
// CONFIGURATION DES HORAIRES
// ============================================================================

/**
 * Plage horaire pour une demi-journée
 */
export interface TimeRange {
  start: string; // Format "HH:MM"
  end: string;   // Format "HH:MM"
}

/**
 * Horaires d'une journée
 */
export interface DaySchedule {
  morning: TimeRange | null;
  afternoon: TimeRange | null;
}

/**
 * Type de disponibilité
 * - 'normal' : Jours ouvrés classiques
 * - 'exceptional' : Vacances scolaires ou jours fériés (Dispo+++)
 */
export type AvailabilityMode = 'normal' | 'exceptional';

// Jours de la semaine (0 = Dimanche, 3 = Mercredi, 4 = Jeudi, 6 = Samedi)
export const WORKING_DAYS = {
  WEDNESDAY: 3,
  THURSDAY: 4,
  SATURDAY: 6,
} as const;

/**
 * Horaires NORMAUX (hors vacances/fériés)
 */
export const NORMAL_SCHEDULE: Record<number, DaySchedule> = {
  // Mercredi
  [WORKING_DAYS.WEDNESDAY]: {
    morning: { start: '09:30', end: '12:30' },
    afternoon: { start: '13:00', end: '16:00' },
  },
  // Jeudi
  [WORKING_DAYS.THURSDAY]: {
    morning: { start: '09:30', end: '12:30' },
    afternoon: { start: '13:00', end: '15:00' },
  },
  // Samedi
  [WORKING_DAYS.SATURDAY]: {
    morning: { start: '10:00', end: '13:00' },
    afternoon: null, // Fermé l'après-midi
  },
};

/**
 * Horaires EXCEPTIONNELS (vacances scolaires + jours fériés)
 * Plus de créneaux disponibles
 */
export const EXCEPTIONAL_SCHEDULE: Record<number, DaySchedule> = {
  // Mercredi
  [WORKING_DAYS.WEDNESDAY]: {
    morning: { start: '09:30', end: '12:30' },
    afternoon: { start: '13:30', end: '18:30' },
  },
  // Jeudi
  [WORKING_DAYS.THURSDAY]: {
    morning: { start: '09:30', end: '12:30' },
    afternoon: { start: '13:30', end: '18:30' },
  },
  // Samedi
  [WORKING_DAYS.SATURDAY]: {
    morning: { start: '09:30', end: '12:30' },
    afternoon: { start: '13:30', end: '18:30' },
  },
};

// ============================================================================
// JOURS FÉRIÉS NATIONAUX FRANÇAIS (2025-2026)
// ============================================================================

/**
 * Liste des jours fériés nationaux français
 * Format : 'YYYY-MM-DD'
 */
export const FRENCH_HOLIDAYS: string[] = [
  // 2025
  '2025-01-01', // Jour de l'An
  '2025-04-21', // Lundi de Pâques
  '2025-05-01', // Fête du Travail
  '2025-05-08', // Victoire 1945
  '2025-05-29', // Ascension
  '2025-06-09', // Lundi de Pentecôte
  '2025-07-14', // Fête Nationale
  '2025-08-15', // Assomption
  '2025-11-01', // Toussaint
  '2025-11-11', // Armistice
  '2025-12-25', // Noël
  
  // 2026
  '2026-01-01', // Jour de l'An
  '2026-04-06', // Lundi de Pâques
  '2026-05-01', // Fête du Travail
  '2026-05-08', // Victoire 1945
  '2026-05-14', // Ascension
  '2026-05-25', // Lundi de Pentecôte
  '2026-07-14', // Fête Nationale
  '2026-08-15', // Assomption
  '2026-11-01', // Toussaint
  '2026-11-11', // Armistice
  '2026-12-25', // Noël
];

// ============================================================================
// VACANCES SCOLAIRES ZONE B (2024-2025 et 2025-2026)
// ============================================================================

/**
 * Périodes de vacances scolaires Zone B
 * Format : { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
 * Les dates incluent le premier et dernier jour de vacances
 */
export interface VacationPeriod {
  name: string;
  start: string;
  end: string;
}

export const SCHOOL_VACATIONS_ZONE_B: VacationPeriod[] = [
  // Année scolaire 2024-2025
  { name: 'Toussaint 2024', start: '2024-10-19', end: '2024-11-04' },
  { name: 'Noël 2024', start: '2024-12-21', end: '2025-01-06' },
  { name: 'Hiver 2025', start: '2025-02-22', end: '2025-03-10' },
  { name: 'Printemps 2025', start: '2025-04-19', end: '2025-05-05' },
  { name: 'Été 2025', start: '2025-07-05', end: '2025-09-01' },
  
  // Année scolaire 2025-2026
  { name: 'Toussaint 2025', start: '2025-10-18', end: '2025-11-03' },
  { name: 'Noël 2025', start: '2025-12-20', end: '2026-01-05' },
  { name: 'Hiver 2026', start: '2026-02-14', end: '2026-03-02' },
  { name: 'Printemps 2026', start: '2026-04-11', end: '2026-04-27' },
  { name: 'Été 2026', start: '2026-07-04', end: '2026-09-01' },
];

// ============================================================================
// JOURS D'INDISPONIBILITÉ TOTALE (Mars - Juin 2026)
// ============================================================================

/**
 * Liste des jours totalement indisponibles
 * Ces jours seront affichés en Terra Cotta dans le calendrier
 * Format : 'YYYY-MM-DD'
 */
export const BLOCKED_DATES: string[] = [
  // Mars 2026
  '2026-03-07', // Samedi
  '2026-03-14', // Samedi (Installation)
  '2026-03-21', // Samedi
  '2026-03-28', // Samedi
  
  // Avril 2026
  '2026-04-04', // Samedi
  '2026-04-11', // Samedi
  '2026-04-18', // Samedi
  '2026-04-25', // Samedi
  
  // Mai 2026
  '2026-05-01', // Vendredi (Férié - Fête du Travail)
  '2026-05-08', // Vendredi (Férié - Victoire 1945)
  '2026-05-02', // Samedi
  '2026-05-09', // Samedi
  '2026-05-16', // Samedi
  '2026-05-23', // Samedi
  '2026-05-30', // Samedi
  
  // Juin 2026
  '2026-06-06', // Samedi
  '2026-06-13', // Samedi
  '2026-06-20', // Samedi
  '2026-06-27', // Samedi
];

// ============================================================================
// CONFIGURATION DE LA DURÉE DES CRÉNEAUX
// ============================================================================

/**
 * Durée de base d'un créneau en minutes
 * Tous les créneaux sont générés en unités de 30 minutes
 */
export const SLOT_DURATION_MINUTES = 30;

/**
 * Intervalle entre les créneaux (pour l'affichage)
 * Permet de générer des créneaux à 9h30, 10h00, 10h30, etc.
 */
export const SLOT_INTERVAL_MINUTES = 30;

// ============================================================================
// CONFIGURATION SYSTÈME
// ============================================================================

/**
 * Date limite de validité de cette configuration
 * Les règles changeront à partir de septembre 2026
 */
export const CONFIG_VALID_UNTIL = '2026-09-01';

/**
 * Nombre de jours à afficher dans le calendrier de réservation
 */
export const BOOKING_CALENDAR_DAYS = 14;

/**
 * Délai minimum avant un rendez-vous (en heures)
 * Empêche les réservations de dernière minute
 */
export const MIN_BOOKING_NOTICE_HOURS = 24;

