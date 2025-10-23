import { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { dataAdapter, type AvailableSlot } from '../lib/data';
import { addDays, startOfWeek, format, isSameDay, parseISO } from '../lib/utils/date';

interface BookingCalendarProps {
  onBookingComplete?: () => void;
}

export function BookingCalendar({ onBookingComplete }: BookingCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date()));
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
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

  useEffect(() => {
    loadAvailableSlots();
  }, [currentWeekStart]);

  const loadAvailableSlots = async () => {
    setLoading(true);
    try {
      const startDate = format(currentWeekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(currentWeekStart, 13), 'yyyy-MM-dd');
      const slots = await dataAdapter.appointments.getAvailableSlots(startDate, endDate);
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
    setShowBookingForm(true);
  };

  const handleBooking = async (e: React.FormEvent) => {
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
      });

      const startTime = `${selectedSlot.date}T${selectedSlot.startTime}`;
      const endTime = `${selectedSlot.date}T${selectedSlot.endTime}`;

      await dataAdapter.appointments.create({
        clientId: newUser.id,
        startTime,
        endTime,
        status: 'scheduled',
        notes: 'Première consultation',
      });

      alert('Votre compte a été créé et votre rendez-vous est confirmé ! Vous pouvez maintenant vous connecter avec votre email et mot de passe.');
      setShowBookingForm(false);
      setSelectedSlot(null);
      setBookingData({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
      loadAvailableSlots();
      onBookingComplete?.();
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Erreur lors de la réservation. Veuillez réessayer.');
    }
  };

  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  };

  const getSlotsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availableSlots.filter(slot => slot.date === dateStr);
  };

  const weekDays = getWeekDays();

  if (loading) {
    return (
      <div className="py-8 text-center">
        <p className="font-body text-gray-600">Chargement des disponibilités...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const slots = getSlotsForDate(day);
          const dayName = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][day.getDay()];

          return (
            <div key={index} className="border rounded-lg p-3">
              <div className="text-center mb-3">
                <p className="font-body text-sm text-gray-600">{dayName}</p>
                <p className="font-body font-semibold text-text">{format(day, 'dd MMM')}</p>
              </div>

              <div className="space-y-2">
                {slots.length === 0 ? (
                  <p className="font-body text-xs text-gray-400 text-center">Indisponible</p>
                ) : (
                  slots.map((slot, slotIndex) => (
                    <button
                      key={slotIndex}
                      onClick={() => handleSlotSelect(slot)}
                      className="w-full px-2 py-1.5 bg-primary/10 hover:bg-primary hover:text-white text-primary rounded text-xs font-body transition"
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

      {showBookingForm && selectedSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="font-title text-2xl font-bold text-text mb-2">
              Confirmer votre rendez-vous
            </h3>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
              <p className="font-body text-sm text-blue-900">
                <strong>Important :</strong> En réservant ce rendez-vous, un compte patient sera automatiquement créé pour vous. Vous pourrez ensuite vous connecter pour gérer vos rendez-vous et documents.
              </p>
            </div>

            <div className="bg-primary/10 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 text-primary mb-2">
                <Calendar className="w-4 h-4" />
                <span className="font-body font-semibold">
                  {format(parseISO(selectedSlot.date), 'EEEE dd MMMM yyyy')}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-primary">
                <Clock className="w-4 h-4" />
                <span className="font-body font-semibold">
                  {selectedSlot.startTime.slice(0, 5)} - {selectedSlot.endTime.slice(0, 5)}
                </span>
              </div>
              <p className="font-body text-sm text-gray-700 mt-2">
                Durée : 1 heure
              </p>
            </div>

            <form onSubmit={handleBooking} className="space-y-4">
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

              <div className="border-t pt-4 mt-2">
                <h4 className="font-body font-semibold text-text mb-3">Créez votre mot de passe</h4>
                <div className="space-y-3">
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
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingForm(false);
                    setSelectedSlot(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-body"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body font-semibold"
                >
                  Créer mon compte et confirmer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
