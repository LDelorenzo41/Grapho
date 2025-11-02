import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  ClipboardList, 
  User, 
  Mail, 
  Phone, 
  Cake,
  Plus,
  X,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Edit2,
  Save
} from 'lucide-react';
import { 
  dataAdapter, 
  type User as UserType, 
  type Session, 
  type Appointment,
  type Document,
  type Message
} from '../../lib/data';
import { formatDate } from '../../lib/utils/date';
import { downloadFile } from '../../lib/storage';

export function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<UserType | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour la gestion des bilans/séances
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
  const [sessionForm, setSessionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    duration: '60',
    summary: '',
    progress: '',
    objectives: '',
  });

  useEffect(() => {
    if (!clientId) return;
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    if (!clientId) return;
    try {
      const [
        clientData, 
        sessionsData, 
        appointmentsData,
        docsData,
        messagesData
      ] = await Promise.all([
        dataAdapter.users.getById(clientId),
        dataAdapter.sessions.getByClientId(clientId),
        dataAdapter.appointments.getByClientId(clientId),
        dataAdapter.documents.getAll(),
        dataAdapter.messages.getAll(),
      ]);
      
      setClient(clientData);
      setSessions(sessionsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setAppointments(appointmentsData);
      
      // Filtrer les documents liés à ce client
      setDocuments(docsData.filter(doc => 
        doc.userId === clientId || 
        doc.uploadedBy === clientId ||
        (doc.visibility === 'specific' && doc.visibleToUserIds?.includes(clientId))
      ));
      
      // Filtrer les messages liés à ce client
      setMessages(messagesData.filter(msg => 
        msg.senderId === clientId || msg.recipientId === clientId
      ));
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les RDV passés qui n'ont pas encore de bilan
  const getAppointmentsWithoutSession = () => {
    const pastAppointments = appointments.filter(apt => 
      new Date(apt.startTime) <= new Date() && apt.status !== 'cancelled'
    );

    // Récupérer les IDs des RDV qui ont déjà une session
    const appointmentIdsWithSession = sessions
      .filter(s => s.appointmentId)
      .map(s => s.appointmentId);

    // Retourner les RDV passés sans session
    return pastAppointments.filter(apt => !appointmentIdsWithSession.includes(apt.id));
  };

  const handleAppointmentSelection = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);

    if (appointmentId) {
      const apt = appointments.find(a => a.id === appointmentId);
      if (apt) {
        const startDate = new Date(apt.startTime);
        const endDate = new Date(apt.endTime);
        const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

        setSessionForm({
          ...sessionForm,
          date: startDate.toISOString().split('T')[0],
          duration: duration.toString(),
        });
      }
    } else {
      // Réinitialiser si "Saisie manuelle" est sélectionnée
      setSessionForm({
        ...sessionForm,
        date: new Date().toISOString().split('T')[0],
        duration: '60',
      });
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    try {
      const nextSessionNumber = sessions.length > 0 
        ? Math.max(...sessions.map(s => s.sessionNumber)) + 1 
        : 1;

      await dataAdapter.sessions.create({
        clientId,
        appointmentId: selectedAppointmentId || undefined,
        date: sessionForm.date,
        duration: parseInt(sessionForm.duration),
        sessionNumber: nextSessionNumber,
        summary: sessionForm.summary,
        progress: sessionForm.progress,
        objectives: sessionForm.objectives || undefined,
      });

      setShowAddSessionModal(false);
      setSelectedAppointmentId('');
      setSessionForm({
        date: new Date().toISOString().split('T')[0],
        duration: '60',
        summary: '',
        progress: '',
        objectives: '',
      });
      await loadClientData();
      alert('Séance ajoutée avec succès !');
    } catch (error) {
      console.error('Error adding session:', error);
      alert('Erreur lors de l\'ajout de la séance');
    }
  };

  const handleEditSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    try {
      await dataAdapter.sessions.update(editingSession.id, {
        date: sessionForm.date,
        duration: parseInt(sessionForm.duration),
        summary: sessionForm.summary,
        progress: sessionForm.progress,
        objectives: sessionForm.objectives || undefined,
      });

      setEditingSession(null);
      setSessionForm({
        date: new Date().toISOString().split('T')[0],
        duration: '60',
        summary: '',
        progress: '',
        objectives: '',
      });
      await loadClientData();
      alert('Séance modifiée avec succès !');
    } catch (error) {
      console.error('Error updating session:', error);
      alert('Erreur lors de la modification de la séance');
    }
  };

  const openEditSessionModal = (session: Session) => {
    setEditingSession(session);
    setSessionForm({
      date: session.date.split('T')[0],
      duration: session.duration.toString(),
      summary: session.summary,
      progress: session.progress,
      objectives: session.objectives || '',
    });
  };

  const handleDownloadDocument = async (doc: Document) => {
    try {
      await downloadFile(doc.filePath, doc.fileName);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Erreur lors du téléchargement');
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

  // Calculer les statistiques
  const pastAppointments = appointments.filter(apt => 
    new Date(apt.startTime) <= new Date() && apt.status !== 'cancelled'
  );
  const upcomingAppointments = appointments.filter(apt => 
    apt.status === 'scheduled' && new Date(apt.startTime) > new Date()
  );
  const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled');

  const appointmentsWithoutSession = getAppointmentsWithoutSession();

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

        {/* En-tête client */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="font-title text-3xl font-bold mb-2">
                  {client.firstName} {client.lastName}
                </h1>
                <div className="flex flex-wrap gap-4 font-body text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.dateOfBirth && (
                    <div className="flex items-center space-x-2">
                      <Cake className="w-4 h-4" />
                      <span>{formatDate(client.dateOfBirth)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right font-body text-sm">
              <p className="opacity-80">Client depuis</p>
              <p className="font-semibold">{formatDate(client.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Mini Dashboard - Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-sm text-gray-600 mb-1">RDV passés</p>
                <p className="font-title text-3xl font-bold text-text">{pastAppointments.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-sm text-gray-600 mb-1">RDV à venir</p>
                <p className="font-title text-3xl font-bold text-text">{upcomingAppointments.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-sm text-gray-600 mb-1">RDV annulés</p>
                <p className="font-title text-3xl font-bold text-text">{cancelledAppointments.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-sm text-gray-600 mb-1">Séances documentées</p>
                <p className="font-title text-3xl font-bold text-text">{sessions.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Section Rendez-vous */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-6 h-6 text-primary" />
            <h2 className="font-title text-2xl font-bold text-text">Rendez-vous</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rendez-vous à venir */}
            <div>
              <h3 className="font-body font-semibold text-text mb-3 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>À venir ({upcomingAppointments.length})</span>
              </h3>
              {upcomingAppointments.length === 0 ? (
                <p className="font-body text-sm text-gray-600">Aucun rendez-vous à venir</p>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map(apt => (
                    <div key={apt.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r-lg">
                      <p className="font-body text-sm font-semibold text-text">
                        {new Date(apt.startTime).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="font-body text-sm text-gray-700">
                        🕐 {new Date(apt.startTime).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} - {new Date(apt.endTime).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {apt.notes && (
                        <p className="font-body text-xs text-gray-600 mt-1 italic">{apt.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rendez-vous passés */}
            <div>
              <h3 className="font-body font-semibold text-text mb-3 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Passés ({pastAppointments.length})</span>
              </h3>
              {pastAppointments.length === 0 ? (
                <p className="font-body text-sm text-gray-600">Aucun rendez-vous passé</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pastAppointments.slice(0, 5).map(apt => {
                    const hasSession = sessions.some(s => s.appointmentId === apt.id);
                    return (
                      <div key={apt.id} className="border-l-4 border-gray-300 pl-4 py-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-body text-sm font-semibold text-text">
                              {new Date(apt.startTime).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="font-body text-xs text-gray-600">
                              {new Date(apt.startTime).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} - {new Date(apt.endTime).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {apt.notes && (
                              <p className="font-body text-xs text-gray-600 mt-1 italic">{apt.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {apt.status === 'completed' && (
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            )}
                            {hasSession && (
                              <span title="Bilan rempli">
                                <ClipboardList className="w-4 h-4 text-purple-600 flex-shrink-0" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {pastAppointments.length > 5 && (
                    <p className="font-body text-xs text-gray-500 italic text-center pt-2">
                      ... et {pastAppointments.length - 5} autre(s) rendez-vous
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section RDV annulés (si il y en a) */}
          {cancelledAppointments.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-body font-semibold text-text mb-3 flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span>Annulés ({cancelledAppointments.length})</span>
              </h3>
              <div className="space-y-2">
                {cancelledAppointments.map(apt => (
                  <div key={apt.id} className="border-l-4 border-red-400 pl-4 py-2 bg-red-50 rounded-r-lg">
                    <p className="font-body text-sm text-gray-700">
                      {new Date(apt.startTime).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })} - {new Date(apt.startTime).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {apt.notes && (
                      <p className="font-body text-xs text-gray-600 mt-1 italic">{apt.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section Bilans/Séances - Pleine largeur */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <ClipboardList className="w-6 h-6 text-primary" />
              <h2 className="font-title text-2xl font-bold text-text">Bilans des séances</h2>
            </div>
            <button
              onClick={() => setShowAddSessionModal(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter</span>
            </button>
          </div>
          
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-body text-gray-600 mb-2">Aucune séance documentée</p>
              <p className="font-body text-sm text-gray-500">
                Cliquez sur "Ajouter" pour créer un bilan après une consultation
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sessions.map(session => (
                <div key={session.id} className="border-l-4 border-primary pl-4 py-3 bg-gray-50 rounded-r-lg group relative">
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-body font-semibold text-text">
                      Séance #{session.sessionNumber}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="font-body text-sm text-gray-600">
                        {formatDate(session.date)}
                      </span>
                      <button
                        onClick={() => openEditSessionModal(session)}
                        className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-gray-200 rounded"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <p className="font-body text-sm text-gray-700 mb-2">
                    <strong>Résumé :</strong> {session.summary}
                  </p>
                  <p className="font-body text-sm text-gray-700 mb-1">
                    <strong>Progrès :</strong> {session.progress}
                  </p>
                  {session.objectives && (
                    <p className="font-body text-sm text-gray-700">
                      <strong>Objectifs :</strong> {session.objectives}
                    </p>
                  )}
                  <p className="font-body text-xs text-gray-500 mt-2">
                    Durée : {session.duration} minutes
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section Documents */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-6 h-6 text-primary" />
            <h2 className="font-title text-2xl font-bold text-text">Documents</h2>
          </div>
          {documents.length === 0 ? (
            <p className="font-body text-gray-600">Aucun document</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map(doc => (
                <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-body font-semibold text-text text-sm truncate">
                        {doc.fileName}
                      </p>
                      <p className="font-body text-xs text-gray-600 mt-1">
                        {(doc.fileSize / 1024).toFixed(1)} KB
                      </p>
                      {doc.category && (
                        <span className="inline-block mt-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                          {doc.category}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDownloadDocument(doc)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <p className="font-body text-xs text-gray-500 mt-2">
                    {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modale d'ajout de séance */}
        {showAddSessionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-title text-2xl font-bold text-text">Nouvelle séance</h3>
                <button 
                  onClick={() => {
                    setShowAddSessionModal(false);
                    setSelectedAppointmentId('');
                  }} 
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSession} className="space-y-4">
                {/* Sélection du RDV */}
                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">
                    Rendez-vous concerné
                  </label>
                  <select
                    value={selectedAppointmentId}
                    onChange={(e) => handleAppointmentSelection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  >
                    <option value="">Saisie manuelle (sans lien à un RDV)</option>
                    {appointmentsWithoutSession.length > 0 && (
                      <optgroup label="Rendez-vous sans bilan">
                        {appointmentsWithoutSession.map(apt => (
                          <option key={apt.id} value={apt.id}>
                            {new Date(apt.startTime).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })} - {new Date(apt.startTime).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  {appointmentsWithoutSession.length === 0 && (
                    <p className="font-body text-xs text-gray-500 mt-1">
                      Tous les rendez-vous passés ont déjà un bilan
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-sm font-medium text-text mb-2">
                      Date de la séance *
                    </label>
                    <input
                      type="date"
                      required
                      value={sessionForm.date}
                      onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                      disabled={!!selectedAppointmentId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-sm font-medium text-text mb-2">
                      Durée (minutes) *
                    </label>
                    <input
                      type="number"
                      required
                      min="15"
                      step="15"
                      value={sessionForm.duration}
                      onChange={(e) => setSessionForm({ ...sessionForm, duration: e.target.value })}
                      disabled={!!selectedAppointmentId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {selectedAppointmentId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="font-body text-sm text-blue-800">
                      ℹ️ La date et la durée sont automatiquement remplies à partir du rendez-vous sélectionné
                    </p>
                  </div>
                )}

                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">
                    Résumé de la séance *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={sessionForm.summary}
                    onChange={(e) => setSessionForm({ ...sessionForm, summary: e.target.value })}
                    placeholder="Décrivez le déroulement de la séance..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  />
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">
                    Progrès observés *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={sessionForm.progress}
                    onChange={(e) => setSessionForm({ ...sessionForm, progress: e.target.value })}
                    placeholder="Décrivez les progrès du client..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  />
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">
                    Objectifs pour la prochaine séance
                  </label>
                  <textarea
                    rows={2}
                    value={sessionForm.objectives}
                    onChange={(e) => setSessionForm({ ...sessionForm, objectives: e.target.value })}
                    placeholder="Optionnel - Définissez les objectifs..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSessionModal(false);
                      setSelectedAppointmentId('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-body"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body font-semibold flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer la séance</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modale d'édition de séance */}
        {editingSession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-title text-2xl font-bold text-text">
                  Modifier la séance #{editingSession.sessionNumber}
                </h3>
                <button 
                  onClick={() => setEditingSession(null)} 
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSession} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-sm font-medium text-text mb-2">
                      Date de la séance *
                    </label>
                    <input
                      type="date"
                      required
                      value={sessionForm.date}
                      onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-sm font-medium text-text mb-2">
                      Durée (minutes) *
                    </label>
                    <input
                      type="number"
                      required
                      min="15"
                      step="15"
                      value={sessionForm.duration}
                      onChange={(e) => setSessionForm({ ...sessionForm, duration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">
                    Résumé de la séance *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={sessionForm.summary}
                    onChange={(e) => setSessionForm({ ...sessionForm, summary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  />
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">
                    Progrès observés *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={sessionForm.progress}
                    onChange={(e) => setSessionForm({ ...sessionForm, progress: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  />
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">
                    Objectifs pour la prochaine séance
                  </label>
                  <textarea
                    rows={2}
                    value={sessionForm.objectives}
                    onChange={(e) => setSessionForm({ ...sessionForm, objectives: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingSession(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-body"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body font-semibold flex items-center justify-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Enregistrer les modifications</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
