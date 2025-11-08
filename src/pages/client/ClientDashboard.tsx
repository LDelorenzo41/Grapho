import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileText, MessageSquare, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataAdapter, type Appointment, type Message, type Document } from '../../lib/data';
import { formatDateTime } from '../../lib/utils/date';

export function ClientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    try {
      const [apts, msgs, docs] = await Promise.all([
        dataAdapter.appointments.getByClientId(user.id),
        dataAdapter.messages.getByUserId(user.id),
        dataAdapter.documents.getVisibleToUser(user.id, user.role),
      ]);
      setAppointments(apts);
      setMessages(msgs);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleMarkAsRead = async (messageId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await dataAdapter.messages.markAsRead(messageId);
      await loadData();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const nextAppointment = appointments
    .filter(apt => apt.status === 'scheduled' && new Date(apt.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

  const unreadMessages = messages.filter(m => !m.read && m.recipientId === user?.id);

  // Compter uniquement les rendez-vous prévus (scheduled) et non annulés
  const scheduledAppointmentsCount = appointments.filter(apt => 
    apt.status === 'scheduled' || apt.status === 'completed'
  ).length;

  if (loading) {
    return <div className="py-16 text-center"><p className="font-body text-gray-600">Chargement...</p></div>;
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-title text-4xl font-bold text-text mb-2">Bonjour {user?.firstName} !</h1>
        <p className="font-body text-gray-600 mb-8">Bienvenue sur votre espace personnel</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/client/rendez-vous"
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition"
          >
            <div className="flex items-center space-x-3 mb-3">
              <Calendar className="w-6 h-6 text-primary" />
              <h3 className="font-title text-lg font-bold text-text">Mes rendez-vous</h3>
            </div>
            <p className="font-body text-3xl font-bold text-text">{scheduledAppointmentsCount}</p>
            <p className="font-body text-sm text-gray-600 mt-1">rendez-vous au total</p>
          </Link>

          <Link
            to="/client/documents"
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition"
          >
            <div className="flex items-center space-x-3 mb-3">
              <FileText className="w-6 h-6 text-secondary" />
              <h3 className="font-title text-lg font-bold text-text">Mes documents</h3>
            </div>
            <p className="font-body text-3xl font-bold text-text">{documents.length}</p>
            <p className="font-body text-sm text-gray-600 mt-1">documents disponibles</p>
          </Link>

          <Link
            to="/client/messages"
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition"
          >
            <div className="flex items-center space-x-3 mb-3">
              <MessageSquare className="w-6 h-6 text-primary" />
              <h3 className="font-title text-lg font-bold text-text">Messages</h3>
            </div>
            <p className="font-body text-3xl font-bold text-text">{unreadMessages.length}</p>
            <p className="font-body text-sm text-gray-600 mt-1">non lus</p>
          </Link>
        </div>

        {nextAppointment && (
          <div className="bg-primary/5 rounded-lg border-2 border-primary p-6 mb-8">
            <h2 className="font-title text-2xl font-bold text-text mb-3">Prochain rendez-vous</h2>
            <p className="font-body text-lg text-gray-700">
              {formatDateTime(nextAppointment.startTime)}
            </p>
            {nextAppointment.notes && (
              <p className="font-body text-sm text-gray-600 mt-2">{nextAppointment.notes}</p>
            )}
          </div>
        )}

        {messages.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="font-title text-2xl font-bold text-text mb-4">Messages récents</h2>
            <div className="space-y-3">
              {messages.slice(0, 3).map(msg => (
                <div key={msg.id} className="border-l-4 border-primary pl-4 py-2 flex items-start justify-between group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-body font-semibold text-text">{msg.subject}</p>
                      {!msg.read && msg.recipientId === user?.id && (
                        <span className="inline-block w-2 h-2 bg-primary rounded-full" title="Non lu"></span>
                      )}
                    </div>
                    <p className="font-body text-sm text-gray-600 line-clamp-2">{msg.content}</p>
                    <p className="font-body text-xs text-gray-500 mt-1">
                      {new Date(msg.sentAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {!msg.read && msg.recipientId === user?.id && (
                    <button
                      onClick={(e) => handleMarkAsRead(msg.id, e)}
                      className="ml-3 p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition opacity-0 group-hover:opacity-100"
                      title="Marquer comme lu"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

