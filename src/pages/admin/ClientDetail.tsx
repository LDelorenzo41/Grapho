import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, ClipboardList } from 'lucide-react';
import { dataAdapter, type User, type Session, type Prescription } from '../../lib/data';
import { formatDate } from '../../lib/utils/date';

export function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) return;
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    if (!clientId) return;
    try {
      const [clientData, sessionsData, prescriptionsData] = await Promise.all([
        dataAdapter.users.getById(clientId),
        dataAdapter.sessions.getByClientId(clientId),
        dataAdapter.prescriptions.getByClientId(clientId),
      ]);
      setClient(clientData);
      setSessions(sessionsData);
      setPrescriptions(prescriptionsData);
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center"><p className="font-body text-gray-600">Chargement...</p></div>;
  }

  if (!client) {
    return (
      <div className="py-16 text-center">
        <p className="font-body text-gray-600">Client non trouvé</p>
        <Link to="/admin/clients" className="text-primary hover:underline mt-4 inline-block">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/admin/clients"
          className="flex items-center space-x-2 text-primary hover:underline mb-6 font-body"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste des clients</span>
        </Link>

        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="font-title text-3xl font-bold text-text mb-4">
            {client.firstName} {client.lastName}
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-body">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-text">{client.email}</p>
            </div>
            {client.phone && (
              <div>
                <p className="text-sm text-gray-600">Téléphone</p>
                <p className="text-text">{client.phone}</p>
              </div>
            )}
            {client.dateOfBirth && (
              <div>
                <p className="text-sm text-gray-600">Date de naissance</p>
                <p className="text-text">{formatDate(client.dateOfBirth)}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Inscrit le</p>
              <p className="text-text">{formatDate(client.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="w-6 h-6 text-primary" />
              <h2 className="font-title text-2xl font-bold text-text">Bilan des séances</h2>
            </div>
            {sessions.length === 0 ? (
              <p className="font-body text-gray-600">Aucune séance enregistrée</p>
            ) : (
              <div className="space-y-4">
                {sessions.map(session => (
                  <div key={session.id} className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-body font-semibold text-text">
                        Séance #{session.sessionNumber}
                      </span>
                      <span className="font-body text-sm text-gray-600">
                        {formatDate(session.date)}
                      </span>
                    </div>
                    <p className="font-body text-sm text-gray-700 mb-1">{session.summary}</p>
                    <p className="font-body text-sm text-gray-600">
                      <strong>Progrès :</strong> {session.progress}
                    </p>
                    {session.objectives && (
                      <p className="font-body text-sm text-gray-600">
                        <strong>Objectifs :</strong> {session.objectives}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ClipboardList className="w-6 h-6 text-secondary" />
              <h2 className="font-title text-2xl font-bold text-text">Prescriptions</h2>
            </div>
            {prescriptions.length === 0 ? (
              <p className="font-body text-gray-600">Aucune prescription</p>
            ) : (
              <div className="space-y-4">
                {prescriptions.map(prescription => (
                  <div key={prescription.id} className="border rounded-lg p-4">
                    <h3 className="font-body font-semibold text-text mb-2">{prescription.title}</h3>
                    <p className="font-body text-sm text-gray-700 mb-3">{prescription.description}</p>
                    <div className="space-y-2">
                      <p className="font-body text-sm text-gray-600">
                        <strong>Exercices :</strong>
                      </p>
                      <ul className="list-disc list-inside space-y-1 font-body text-sm text-gray-700">
                        {prescription.exercises.map((exercise, idx) => (
                          <li key={idx}>{exercise}</li>
                        ))}
                      </ul>
                      {prescription.frequency && (
                        <p className="font-body text-sm text-gray-600 mt-2">
                          <strong>Fréquence :</strong> {prescription.frequency}
                        </p>
                      )}
                      {prescription.duration && (
                        <p className="font-body text-sm text-gray-600">
                          <strong>Durée :</strong> {prescription.duration}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
