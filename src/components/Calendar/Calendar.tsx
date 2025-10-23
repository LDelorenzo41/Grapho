import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Appointment, User } from '../../lib/data';

interface CalendarProps {
  appointments: Appointment[];
  clients?: User[];
  onDateClick?: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
}

type ViewMode = 'month' | 'week' | 'day';

export function Calendar({ appointments, clients = [], onDateClick, onAppointmentClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const getClientAppointmentCount = useMemo(() => {
    const counts: { [key: string]: number } = {};
    const sortedAppts = [...appointments].sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    sortedAppts.forEach((apt) => {
      if (apt.clientId !== 'guest') {
        counts[apt.id] = (counts[apt.clientId] || 0) + 1;
        counts[apt.clientId] = counts[apt.id];
      }
    });

    return (aptId: string, clientId: string) => {
      if (clientId === 'guest') return 0;
      const clientAppts = sortedAppts.filter(a => a.clientId === clientId && a.status !== 'cancelled');
      const index = clientAppts.findIndex(a => a.id === aptId);
      return index + 1;
    };
  }, [appointments]);

  const getAppointmentLabel = (apt: Appointment) => {
    if (apt.clientId === 'guest') {
      return '1er RDV';
    }
    const client = clients.find(c => c.id === apt.clientId);
    const sessionNumber = getClientAppointmentCount(apt.id, apt.clientId);
    return client ? `${client.firstName} ${client.lastName} - S${sessionNumber}` : 'Client inconnu';
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() - 1);
    else if (viewMode === 'week') newDate.setDate(currentDate.getDate() - 7);
    else newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() + 1);
    else if (viewMode === 'week') newDate.setDate(currentDate.getDate() + 7);
    else newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getAppointmentsForDate = (date: Date | null) => {
    if (!date) return [];
    return appointments.filter(apt => {
      const aptDate = new Date(apt.startTime);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getAppointmentsForDateRange = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.startTime);
      return aptDate.toDateString() === date.toDateString();
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  const renderMonth = () => {
    const days = getMonthDays();
    const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    return (
      <div>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center font-body text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            const dayAppointments = getAppointmentsForDate(date);
            const isToday = date?.toDateString() === new Date().toDateString();

            return (
              <div
                key={index}
                onClick={() => date && onDateClick?.(date)}
                className={`min-h-[80px] p-2 border rounded-lg ${
                  date ? 'bg-white cursor-pointer hover:bg-gray-50' : 'bg-gray-100'
                } ${isToday ? 'border-primary border-2' : 'border-gray-200'}`}
              >
                {date && (
                  <>
                    <div className="font-body text-sm font-semibold text-text mb-1">
                      {date.getDate()}
                    </div>
                    {dayAppointments.length > 0 && (
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 2).map(apt => (
                          <div
                            key={apt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAppointmentClick?.(apt);
                            }}
                            className="text-xs bg-primary/10 text-primary px-1 py-0.5 rounded truncate cursor-pointer hover:bg-primary/20"
                            title={getAppointmentLabel(apt)}
                          >
                            {new Date(apt.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            {clients.length > 0 && (
                              <div className="truncate font-semibold">{getAppointmentLabel(apt)}</div>
                            )}
                          </div>
                        ))}
                        {dayAppointments.length > 2 && (
                          <div className="text-xs text-gray-600">+{dayAppointments.length - 2}</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeek = () => {
    const days = getWeekDays();
    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const hours = Array.from({ length: 13 }, (_, i) => i + 8);

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="text-center font-body text-sm font-semibold text-gray-600 py-2"></div>
            {days.map((date, index) => {
              const isToday = date.toDateString() === new Date().toDateString();
              return (
                <div key={index} className="text-center font-body text-sm">
                  <div className="font-semibold text-gray-600">{weekDays[index]}</div>
                  <div className={`${isToday ? 'text-primary font-bold' : 'text-gray-600'}`}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-8 gap-2">
            <div className="space-y-2">
              {hours.map(hour => (
                <div key={hour} className="h-16 flex items-center justify-end pr-2 font-body text-xs text-gray-600">
                  {hour}:00
                </div>
              ))}
            </div>
            {days.map((date, dayIndex) => (
              <div key={dayIndex} className="space-y-2">
                {hours.map(hour => {
                  const hourAppointments = getAppointmentsForDateRange(date).filter(apt => {
                    const aptHour = new Date(apt.startTime).getHours();
                    return aptHour === hour;
                  });

                  return (
                    <div key={hour} className="h-16 border border-gray-200 rounded p-1 bg-white">
                      {hourAppointments.map(apt => (
                        <div
                        key={apt.id}
                        onClick={() => onAppointmentClick?.(apt)}
                        className="text-xs bg-primary/20 text-primary p-1 rounded mb-1 truncate cursor-pointer hover:bg-primary/30"
                        title={getAppointmentLabel(apt)}
                      >
                          {new Date(apt.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {clients.length > 0 && (
                            <div className="truncate font-semibold">{getAppointmentLabel(apt)}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDay = () => {
    const hours = Array.from({ length: 13 }, (_, i) => i + 8);
    const dayAppointments = getAppointmentsForDateRange(currentDate);

    return (
      <div className="max-w-2xl mx-auto">
        <div className="space-y-2">
          {hours.map(hour => {
            const hourAppointments = dayAppointments.filter(apt => {
              const aptHour = new Date(apt.startTime).getHours();
              return aptHour === hour;
            });

            return (
              <div key={hour} className="flex items-start space-x-4">
                <div className="w-20 font-body text-sm text-gray-600 pt-2">
                  {hour}:00
                </div>
                <div className="flex-1 min-h-[60px] border border-gray-200 rounded-lg p-3 bg-white">
                  {hourAppointments.length === 0 ? (
                    <div className="text-sm text-gray-400">-</div>
                  ) : (
                    <div className="space-y-2">
                      {hourAppointments.map(apt => (
                        <div
                          key={apt.id}
                          onClick={() => onAppointmentClick?.(apt)}
                          className="bg-primary/10 text-primary p-3 rounded-lg cursor-pointer hover:bg-primary/20"
                        >
                          <div className="font-body font-semibold text-sm mb-1">
                            {new Date(apt.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {new Date(apt.endTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {clients.length > 0 && (
                            <div className="font-body font-bold text-base mb-1">{getAppointmentLabel(apt)}</div>
                          )}
                          {apt.notes && (
                            <div className="font-body text-xs text-gray-700">{apt.notes}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button onClick={goToPrevious} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-title text-2xl font-bold text-text">
            {viewMode === 'month' && currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            {viewMode === 'week' && `Semaine du ${getWeekDays()[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`}
            {viewMode === 'day' && currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={goToNext} className="p-2 hover:bg-gray-100 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex space-x-2">
          {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg font-body text-sm ${
                viewMode === mode
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mode === 'month' ? 'Mois' : mode === 'week' ? 'Semaine' : 'Jour'}
            </button>
          ))}
        </div>
      </div>
      {viewMode === 'month' && renderMonth()}
      {viewMode === 'week' && renderWeek()}
      {viewMode === 'day' && renderDay()}
    </div>
  );
}
