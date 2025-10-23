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
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="font-body text-gray-600">Vous n'avez pas encore de rendez-vous</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <CalendarIcon className="w-6 h-6 text-primary mt-1" />
                    <div>
                      <h3 className="font-title text-lg font-bold text-text mb-1">
                        Séance de graphothérapie
                      </h3>
                      <p className="font-body text-gray-700 mb-2">
                        {formatDateTime(appointment.startTime)}
                      </p>
                      {appointment.notes && (
                        <p className="font-body text-sm text-gray-600">{appointment.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-body font-semibold ${getStatusColor(appointment.status)}`}>
                      {getStatusLabel(appointment.status)}
                    </span>
                    {appointment.status === 'scheduled' && (
                      <button
                        onClick={() => handleDownloadICS(appointment)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body font-semibold flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Ajouter au calendrier</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
