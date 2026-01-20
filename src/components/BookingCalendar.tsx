import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle, Info, LogIn, User } from 'lucide-react';
import { dataAdapter, type AvailableSlot } from '../lib/data';
import { addDays, startOfWeek, format, parseISO } from '../lib/utils/date';
import { sendNewAppointmentNotification } from '../lib/email';
import { useAuth } from '../contexts/AuthContext';
import {
  APPOINTMENT_TYPES,
  ONLINE_BOOKABLE_TYPES,
  CALENDAR_COLORS,
} from '../lib/appointment';
import type { AppointmentType } from '../lib/appointment';
import { getDayInfo } from '../lib/appointment/availabilityService';

interface BookingCalendarProps {
  onBookingComplete?: () => void;
}

// Helper pour obtenir la timezone locale au format +01:00 ou +02:00
function getLocalTimezoneOffset(dateString: string): string {
  const date = new Date(dateString);
  const offset = -date.getTimezoneOffset();
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  const sign = offset >= 0 ? '+' : '-';
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function BookingCalendar({ onBookingComplete }: BookingCalendarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()));
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [selectedType, setSelectedType] = useState<AppointmentType>('premier_rdv');
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<{
    date: string;
    startTime: string;
    endTime: string;
    type: AppointmentType;
  } | null>(null);

  // Vérifier si le type sélectionné nécessite d'être connecté
  const requiresLogin = selectedType === 'remediation';
  const isLoggedIn = !!user;

  useEffect(() => {
    loadAvailableSlots();
  }, [currentWeekStart, selectedType]);

  const loadAvailableSlots = async () => {
    setLoading(true);
    try {
      const startDate = format(currentWeekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(currentWeekStart, 13), 'yyyy-MM-dd');
      const slots = await dataAdapter.appointments.getAvailableSlots(startDate, endDate, selectedType);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    
    // Si séance de remédiation et pas connecté, afficher le prompt de connexion
    if (requiresLogin && !isLoggedIn) {
      setShowLoginPrompt(true);
    } else {
      setShowBookingForm(true);
    }
  };

  // Calculer l'heure de fin selon le type de RDV
  const getEndTimeForType = (startTime: string, type: AppointmentType): string => {
    const config = APPOINTMENT_TYPES[type];
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + config.duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMins = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}:00`;
  };

  // Réservation pour utilisateur connecté (séance de remédiation)
  const handleBookingLoggedIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !user) return;

    try {
      const endTime = getEndTimeForType(selectedSlot.startTime, selectedType);
      
      const baseStartTime = `${selectedSlot.date}T${selectedSlot.startTime}`;
      const baseEndTime = `${selectedSlot.date}T${endTime}`;
      const timezoneOffset = getLocalTimezoneOffset(baseStartTime);
      
      const startTimeWithTz = `${baseStartTime.slice(0, -3)}${timezoneOffset}`;
      const endTimeWithTz = `${baseEndTime.slice(0, -3)}${timezoneOffset}`;

      const typeConfig = APPOINTMENT_TYPES[selectedType];
      const appointmentNote = `${typeConfig.label} - Durée : ${typeConfig.duration} minutes`;

      await dataAdapter.appointments.create({
        clientId: user.id,
        startTime: startTimeWithTz,
        endTime: endTimeWithTz,
        status: 'scheduled',
        notes: appointmentNote,
      });

      const emailSent = await sendNewAppointmentNotification({
        clientFirstName: user.firstName,
        clientLastName: user.lastName,
        clientEmail: user.email,
        clientPhone: user.phone || '',
        appointmentDate: format(parseISO(selectedSlot.date), 'EEEE dd MMMM yyyy'),
        appointmentTime: selectedSlot.startTime.slice(0, 5),
        appointmentType: typeConfig.label,
        appointmentDuration: typeConfig.duration,
      });

      if (!emailSent) {
        console.warn('Email de notification non envoyé');
      }

      setConfirmedAppointment({
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: endTime,
        type: selectedType,
      });

      setShowBookingForm(false);
      setShowSuccessModal(true);
      setSelectedSlot(null);
      loadAvailableSlots();
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Erreur lors de la réservation. Veuillez réessayer.');
    }
  };

  // Réservation avec création de compte (premier RDV)
  const handleBookingNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    if (bookingData.password !== bookingData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }

    if (bookingData.password.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    try {
      const existingUser = await dataAdapter.users.getByEmail(bookingData.email);
      if (existingUser) {
        alert('Un compte existe déjà avec cet email. Veuillez vous connecter.');
        return;
      }

      const newUser = await dataAdapter.users.create({
        email: bookingData.email,
        role: 'client',
        firstName: bookingData.firstName,
        lastName: bookingData.lastName,
        phone: bookingData.phone,
        password: bookingData.password,
      });

      // Calculer l'heure de fin selon le type de RDV
      const endTime = getEndTimeForType(selectedSlot.startTime, selectedType);
      
      const baseStartTime = `${selectedSlot.date}T${selectedSlot.startTime}`;
      const baseEndTime = `${selectedSlot.date}T${endTime}`;
      const timezoneOffset = getLocalTimezoneOffset(baseStartTime);
      
      const startTimeWithTz = `${baseStartTime.slice(0, -3)}${timezoneOffset}`;
      const endTimeWithTz = `${baseEndTime.slice(0, -3)}${timezoneOffset}`;

      const typeConfig = APPOINTMENT_TYPES[selectedType];
      const appointmentNote = `${typeConfig.label} - Durée : ${typeConfig.duration} minutes`;

      await dataAdapter.appointments.create({
        clientId: newUser.id,
        startTime: startTimeWithTz,
        endTime: endTimeWithTz,
        status: 'scheduled',
        notes: appointmentNote,
      });

      const emailSent = await sendNewAppointmentNotification({
        clientFirstName: bookingData.firstName,
        clientLastName: bookingData.lastName,
        clientEmail: bookingData.email,
        clientPhone: bookingData.phone,
        appointmentDate: format(parseISO(selectedSlot.date), 'EEEE dd MMMM yyyy'),
        appointmentTime: selectedSlot.startTime.slice(0, 5),
        appointmentType: typeConfig.label,
        appointmentDuration: typeConfig.duration,
      });


      if (!emailSent) {
        console.warn('Email de notification non envoyé');
      }

      setConfirmedAppointment({
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: endTime,
        type: selectedType,
      });

      setShowBookingForm(false);
      setShowSuccessModal(true);
      setSelectedSlot(null);
      setBookingData({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
      loadAvailableSlots();
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Erreur lors de la réservation. Veuillez réessayer.');
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setConfirmedAppointment(null);
    onBookingComplete?.();
  };

  const handleGoToLogin = () => {
    setShowLoginPrompt(false);
    navigate('/connexion');
  };

  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  };

  const getSlotsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availableSlots.filter(slot => slot.date === dateStr);
  };

  // Récupérer les infos du jour pour l'affichage
  const getDayDisplayInfo = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return getDayInfo(dateStr);
  };

  const weekDays = getWeekDays();
  const selectedTypeConfig = APPOINTMENT_TYPES[selectedType];

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="font-body text-gray-600">Chargement des disponibilités...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sélection du type de rendez-vous */}
      <div className="bg-white rounded-lg border p-4">
        <h4 className="font-title text-lg font-semibold text-text mb-3">
          Type de rendez-vous
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ONLINE_BOOKABLE_TYPES.map((typeId) => {
            const config = APPOINTMENT_TYPES[typeId];
            const isSelected = selectedType === typeId;
            const needsLogin = typeId === 'remediation';
            
            return (
              <button
                key={typeId}
                onClick={() => setSelectedType(typeId)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-[#8FA382] bg-[#8FA382]/10'
                    : 'border-gray-200 hover:border-[#8FA382]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-body font-semibold text-text">
                    {config.label}
                  </span>
                  <span 
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{ 
                      backgroundColor: isSelected ? CALENDAR_COLORS.available : '#E5E7EB',
                      color: isSelected ? 'white' : '#6B7280'
                    }}
                  >
                    {config.duration} min
                  </span>
                </div>
                <p className="font-body text-sm text-gray-600">
                  {config.description}
                </p>
                {needsLogin && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-amber-700">
                    <LogIn className="w-3 h-3" />
                    <span>Réservé aux clients existants</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Info sur le bilan */}
        <div 
          className="mt-4 p-3 rounded-lg flex items-start gap-3"
          style={{ backgroundColor: `${CALENDAR_COLORS.accent}20` }}
        >
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: CALENDAR_COLORS.unavailable }} />
          <p className="font-body text-sm text-gray-700">
            <strong>Bilan complet :</strong> La prise de rendez-vous pour un bilan s'effectue 
            lors de votre premier rendez-vous de rencontre au cabinet.
          </p>
        </div>

        {/* Info si séance de remédiation sélectionnée */}
        {requiresLogin && (
          <div 
            className="mt-4 p-3 rounded-lg flex items-start gap-3"
            style={{ backgroundColor: isLoggedIn ? '#ECFDF5' : '#FEF3C7' }}
          >
            {isLoggedIn ? (
              <>
                <User className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
                <p className="font-body text-sm text-green-800">
                  <strong>Connecté en tant que {user?.firstName} {user?.lastName}</strong> - 
                  Vous pouvez réserver une séance de remédiation.
                </p>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="font-body text-sm text-amber-800">
                  <strong>Connexion requise :</strong> La séance de remédiation est réservée aux clients 
                  ayant déjà eu un premier rendez-vous. 
                  <button 
                    onClick={() => navigate('/connexion')}
                    className="ml-1 underline hover:no-underline font-semibold"
                  >
                    Se connecter
                  </button>
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Navigation du calendrier */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePreviousWeek}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-title text-lg font-bold text-text">
          Semaine du {format(currentWeekStart, 'dd MMMM yyyy')}
        </h3>
        <button
          onClick={handleNextWeek}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Légende des couleurs */}
      <div className="flex flex-wrap gap-4 text-sm font-body">
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded"
            style={{ backgroundColor: CALENDAR_COLORS.available }}
          />
          <span>Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded"
            style={{ backgroundColor: CALENDAR_COLORS.unavailable }}
          />
          <span>Indisponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded"
            style={{ backgroundColor: CALENDAR_COLORS.accent }}
          />
          <span>Vacances/Férié (+ de créneaux)</span>
        </div>
      </div>

      {/* Grille du calendrier */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const slots = getSlotsForDate(day);
          const dayInfo = getDayDisplayInfo(day);
          const dayName = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][day.getDay()];
          
          // Déterminer le style du header du jour
          let headerBgColor: string = CALENDAR_COLORS.background;
          let headerTextColor: string = '#374151';
          
          if (dayInfo.isBlocked) {
            headerBgColor = CALENDAR_COLORS.unavailable;
            headerTextColor = 'white';
          } else if (dayInfo.isWorkingDay && (dayInfo.isHoliday || dayInfo.isVacation)) {
            headerBgColor = CALENDAR_COLORS.accent;
            headerTextColor = 'white';
          } else if (dayInfo.isWorkingDay) {
            headerBgColor = CALENDAR_COLORS.available;
            headerTextColor = 'white';
          }

          return (
            <div 
              key={index} 
              className="border rounded-lg overflow-hidden"
              style={{ borderColor: dayInfo.isBlocked ? CALENDAR_COLORS.unavailable : '#E5E7EB' }}
            >
              <div 
                className="text-center p-3"
                style={{ backgroundColor: headerBgColor, color: headerTextColor }}
              >
                <p className="font-body text-sm">{dayName}</p>
                <p className="font-body font-semibold">{format(day, 'dd-MM')}</p>
                {dayInfo.isHoliday && (
                  <span className="text-xs opacity-80">Férié</span>
                )}
                {dayInfo.isVacation && !dayInfo.isHoliday && (
                  <span className="text-xs opacity-80">Vacances</span>
                )}
              </div>

              <div className="p-3 space-y-2 min-h-[100px]">
                {dayInfo.isBlocked ? (
                  <p className="font-body text-xs text-center" style={{ color: CALENDAR_COLORS.unavailable }}>
                    Fermé
                  </p>
                ) : slots.length === 0 ? (
                  <p className="font-body text-xs text-gray-400 text-center">
                    {dayInfo.isWorkingDay ? 'Complet' : 'Non travaillé'}
                  </p>
                ) : (
                  slots.map((slot, slotIndex) => (
                    <button
                      key={slotIndex}
                      onClick={() => handleSlotSelect(slot)}
                      className="w-full px-2 py-1.5 rounded text-xs font-body transition"
                      style={{
                        backgroundColor: `${CALENDAR_COLORS.available}20`,
                        color: CALENDAR_COLORS.available,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = CALENDAR_COLORS.available;
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${CALENDAR_COLORS.available}20`;
                        e.currentTarget.style.color = CALENDAR_COLORS.available;
                      }}
                    >
                      {slot.startTime.slice(0, 5)}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modale de prompt de connexion (pour séance de remédiation) */}
      {showLoginPrompt && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-center mb-6">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#FEF3C7' }}
              >
                <LogIn className="w-8 h-8 text-amber-600" />
              </div>
            </div>

            <h3 className="font-title text-2xl font-bold text-text text-center mb-2">
              Connexion requise
            </h3>

            <p className="font-body text-center text-gray-600 mb-6">
              Pour réserver une <strong>séance de remédiation</strong>, vous devez être connecté 
              à votre espace client. Ce type de rendez-vous est réservé aux patients ayant déjà 
              eu un premier rendez-vous.
            </p>

            <div 
              className="rounded-lg p-4 mb-6"
              style={{ backgroundColor: `${CALENDAR_COLORS.available}15` }}
            >
              <p className="font-body text-sm text-gray-600 mb-2">
                <strong>Créneau sélectionné :</strong>
              </p>
              <div className="flex items-center space-x-2" style={{ color: CALENDAR_COLORS.available }}>
                <Calendar className="w-4 h-4" />
                <span className="font-body font-semibold">
                  {format(parseISO(selectedSlot.date), 'EEEE dd MMMM yyyy')}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-1" style={{ color: CALENDAR_COLORS.available }}>
                <Clock className="w-4 h-4" />
                <span className="font-body font-semibold">
                  {selectedSlot.startTime.slice(0, 5)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  setSelectedSlot(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-body font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleGoToLogin}
                className="flex-1 px-4 py-2 rounded-lg font-body font-medium transition flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: CALENDAR_COLORS.available,
                  color: 'white'
                }}
              >
                <LogIn className="w-4 h-4" />
                Se connecter
              </button>
            </div>

            <p className="font-body text-xs text-center text-gray-500 mt-4">
              Nouveau patient ? Réservez d'abord un <strong>Premier rendez-vous</strong> pour créer votre compte.
            </p>
          </div>
        </div>
      )}

      {/* Modale de formulaire de réservation */}
      {showBookingForm && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="font-title text-2xl font-bold text-text mb-2">
              Confirmer votre rendez-vous
            </h3>
            
            {/* Message différent selon si connecté ou non */}
            {isLoggedIn ? (
              <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4">
                <p className="font-body text-sm text-green-900">
                  <strong>Connecté en tant que :</strong> {user?.firstName} {user?.lastName}
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
                <p className="font-body text-sm text-blue-900">
                  <strong>Important :</strong> En réservant ce rendez-vous, un compte patient sera automatiquement créé pour vous.
                </p>
              </div>
            )}

            <div 
              className="rounded-lg p-4 mb-6"
              style={{ backgroundColor: `${CALENDAR_COLORS.available}15` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span 
                  className="px-3 py-1 rounded-full text-sm font-semibold"
                  style={{ 
                    backgroundColor: CALENDAR_COLORS.available,
                    color: 'white'
                  }}
                >
                  {selectedTypeConfig.label}
                </span>
                <span className="font-body text-sm text-gray-600">
                  {selectedTypeConfig.duration} minutes
                </span>
              </div>
              <div className="flex items-center space-x-2 mb-2" style={{ color: CALENDAR_COLORS.available }}>
                <Calendar className="w-4 h-4" />
                <span className="font-body font-semibold">
                  {format(parseISO(selectedSlot.date), 'EEEE dd MMMM yyyy')}
                </span>
              </div>
              <div className="flex items-center space-x-2" style={{ color: CALENDAR_COLORS.available }}>
                <Clock className="w-4 h-4" />
                <span className="font-body font-semibold">
                  {selectedSlot.startTime.slice(0, 5)} - {getEndTimeForType(selectedSlot.startTime, selectedType).slice(0, 5)}
                </span>
              </div>
            </div>

            {/* Formulaire différent selon si connecté ou non */}
            {isLoggedIn ? (
              // Formulaire simplifié pour utilisateur connecté
              <form onSubmit={handleBookingLoggedIn} className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-body text-sm text-gray-600 mb-2">Vos informations :</p>
                  <p className="font-body font-semibold text-text">{user?.firstName} {user?.lastName}</p>
                  <p className="font-body text-sm text-gray-600">{user?.email}</p>
                  {user?.phone && (
                    <p className="font-body text-sm text-gray-600">{user?.phone}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingForm(false);
                      setSelectedSlot(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-body font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg font-body font-medium transition"
                    style={{ 
                      backgroundColor: CALENDAR_COLORS.available,
                      color: 'white'
                    }}
                  >
                    Confirmer le rendez-vous
                  </button>
                </div>
              </form>
            ) : (
              // Formulaire complet pour nouveau patient
              <form onSubmit={handleBookingNewUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-sm font-medium text-text mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookingData.firstName}
                      onChange={(e) => setBookingData({ ...bookingData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-sm font-medium text-text mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookingData.lastName}
                      onChange={(e) => setBookingData({ ...bookingData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={bookingData.email}
                    onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  />
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={bookingData.phone}
                    onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  />
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">
                    Mot de passe * (min. 6 caractères)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={bookingData.password}
                    onChange={(e) => setBookingData({ ...bookingData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  />
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">
                    Confirmer le mot de passe *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={bookingData.confirmPassword}
                    onChange={(e) => setBookingData({ ...bookingData, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingForm(false);
                      setSelectedSlot(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-body font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg font-body font-medium transition"
                    style={{ 
                      backgroundColor: CALENDAR_COLORS.available,
                      color: 'white'
                    }}
                  >
                    Créer mon compte et confirmer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modale de confirmation de succès */}
      {showSuccessModal && confirmedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-center mb-6">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${CALENDAR_COLORS.available}20` }}
              >
                <CheckCircle className="w-12 h-12" style={{ color: CALENDAR_COLORS.available }} />
              </div>
            </div>

            <h3 className="font-title text-2xl font-bold text-text text-center mb-2">
              Réservation confirmée !
            </h3>

            <p className="font-body text-center text-gray-600 mb-2">
              {isLoggedIn 
                ? 'Votre rendez-vous a été enregistré avec succès.'
                : 'Votre compte a été créé avec succès et votre rendez-vous est confirmé.'
              }
            </p>
            <p className="font-body text-center text-sm text-green-600 mb-6">
              Un email de confirmation vous a été envoyé.
            </p>

            <div 
              className="rounded-lg p-4 mb-6 border-l-4"
              style={{ 
                backgroundColor: `${CALENDAR_COLORS.available}10`,
                borderColor: CALENDAR_COLORS.available
              }}
            >
              <p className="font-body text-sm text-gray-600 mb-3">
                <strong>Rendez-vous confirmé pour :</strong>
              </p>
              <div className="space-y-2">
                <div 
                  className="px-3 py-1 rounded-full text-sm font-semibold inline-block mb-2"
                  style={{ 
                    backgroundColor: CALENDAR_COLORS.available,
                    color: 'white'
                  }}
                >
                  {APPOINTMENT_TYPES[confirmedAppointment.type].label}
                </div>
                <div className="flex items-center space-x-3 text-text">
                  <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: CALENDAR_COLORS.available }} />
                  <span className="font-body font-semibold">
                    {format(parseISO(confirmedAppointment.date), 'EEEE dd MMMM yyyy')}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-text">
                  <Clock className="w-5 h-5 flex-shrink-0" style={{ color: CALENDAR_COLORS.available }} />
                  <span className="font-body font-semibold">
                    {confirmedAppointment.startTime.slice(0, 5)} - {confirmedAppointment.endTime.slice(0, 5)}
                  </span>
                </div>
              </div>
            </div>

            {!isLoggedIn && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="font-body text-sm text-blue-900">
                  <strong>Prochaine étape :</strong> Connectez-vous avec votre email et mot de passe pour accéder à votre espace client.
                </p>
              </div>
            )}

            <button
              onClick={handleCloseSuccessModal}
              className="w-full px-6 py-3 rounded-lg font-body font-semibold transition shadow-md hover:shadow-lg"
              style={{ 
                backgroundColor: CALENDAR_COLORS.available,
                color: 'white'
              }}
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



