import type { Appointment } from '../data/types';

const formatICSDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
};

export const generateICS = (
  appointment: Appointment,
  clientName: string,
  location?: string
): string => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cabinet Graphotherapie//FR',
    'CALNAME:Mes rendez-vous',
    'X-WR-CALNAME:Mes rendez-vous',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@graphotherapie.fr`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(appointment.startTime)}`,
    `DTEND:${formatICSDate(appointment.endTime)}`,
    'SUMMARY:Séance de graphothérapie',
    `DESCRIPTION:Séance avec ${clientName}${appointment.notes ? `\\n${appointment.notes}` : ''}`,
  ];

  if (location) {
    lines.push(`LOCATION:${location}`);
  }

  lines.push('STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
};

export const downloadICS = (icsContent: string, filename: string = 'rendez-vous.ics') => {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
