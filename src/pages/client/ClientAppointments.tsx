import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataAdapter, type Appointment } from '../../lib/data';
import { formatDateTime } from '../../lib/utils/date';
import { generateICS, downloadICS } from '../../lib/utils/ics';

export function ClientAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppointments = async () => {
      if (!user) return;
      try {
        const apts = await dataAdapter.appointments.getByClientId(user.id);
        setAppointments(apts.sort((a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        ));
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAppointments();
  }, [user]);

  const handleDownloadICS = (appointment: Appointment) => {
    if (!user) return;
    const icsContent = generateICS(
      appointment,
      `${user.firstName} ${user.lastName}`,
      '123 Avenue de la République, 75000 Paris'
    );
    downloadICS(icsContent);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Prévu';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  if (loading) {
    return <div className="py-16 text-center"><p className="font-body text-gray-600">Chargement...</p></div>;
  }

  return (
    <div className="py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-title text-4xl font-bold text-text mb-8">Mes rendez-vous</h1>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="font-body text-gray-600 mb-4">Aucun rendez-vous</p>
            <a
              href="/contact"
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body font-semibold"
            >
              Prendre rendez-vous
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map(apt => (
              <div key={apt.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <CalendarIcon className="w-5 h-5 text-primary" />
                      <h3 className="font-title text-xl font-bold text-text">
                        Séance de graphothérapie
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(apt.status)}`}>
                        {getStatusLabel(apt.status)}
                      </span>
                    </div>
                    <p className="font-body text-gray-700 mb-2">
                      {formatDateTime(apt.startTime)}
                    </p>
                    {apt.notes && (
                      <p className="font-body text-sm text-gray-600">{apt.notes}</p>
                    )}
                  </div>
                  {apt.status === 'scheduled' && (
                    <button
                      onClick={() => handleDownloadICS(apt)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-body text-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Télécharger</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
