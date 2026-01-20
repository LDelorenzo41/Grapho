import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar as CalendarIcon, FileText, Plus, X, Edit2, Trash2, MessageSquare, AlertTriangle, UserPlus, Check, HardDrive, ExternalLink } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../../contexts/AuthContext';
import { dataAdapter, type User, type Appointment, type Document, type Message, type AvailableSlot } from '../../lib/data';
import { Calendar } from '../../components/Calendar/Calendar';

// Créer le client Supabase pour accéder au storage
const getSupabaseClient = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
};
const supabase = getSupabaseClient();

// Extraire l'ID du projet Supabase depuis l'URL
const getSupabaseProjectId = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) return null;
  // URL format: https://<project_id>.supabase.co
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
};

export function AdminDashboard() {
  const { user } = useAuth();
  const [clients, setClients] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newAppointment, setNewAppointment] = useState({
    clientId: '',
    date: '',
    startTime: '',
    duration: '60',
    notes: '',
  });
  const [editAppointment, setEditAppointment] = useState({
    clientId: '',
    date: '',
    startTime: '',
    duration: '60',
    notes: '',
  });

  // Nouveaux états pour la gestion des conflits
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictingAppointments, setConflictingAppointments] = useState<Appointment[]>([]);
  const [pendingAction, setPendingAction] = useState<'add' | 'edit' | null>(null);

  // État pour la modale de confirmation de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

  // État pour la pagination des prochains rendez-vous
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 10;

  // États pour la création de client
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [createWithAppointment, setCreateWithAppointment] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // État pour le stockage Supabase
  const [storageUsed, setStorageUsed] = useState<number>(0);
  const [loadingStorage, setLoadingStorage] = useState(true);
  const STORAGE_LIMIT_MB = 500; // Limite gratuite Supabase

  useEffect(() => {
    loadData();
    loadStorageUsage();
  }, []);

  const loadData = async () => {
    try {
      const [allUsers, allAppts, allDocs, allMsgs] = await Promise.all([
        dataAdapter.users.getAll(),
        dataAdapter.appointments.getAll(),
        dataAdapter.documents.getAll(),
        dataAdapter.messages.getAll(),
      ]);
      setClients(allUsers.filter(u => u.role === 'client'));
      setAppointments(allAppts);
      setDocuments(allDocs);
      setMessages(allMsgs.filter(m => user && m.senderId === user.id));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger l'utilisation du stockage Supabase (parcours récursif)
  const loadStorageUsage = async () => {
    setLoadingStorage(true);
    try {
      if (!supabase) {
        console.warn('Supabase not configured');
        setStorageUsed(0);
        setLoadingStorage(false);
        return;
      }

      // Fonction récursive pour parcourir tous les dossiers
      const calculateFolderSize = async (path: string = ''): Promise<number> => {
        let totalSize = 0;

        const { data: items, error } = await supabase.storage
          .from('documents')
          .list(path, { limit: 1000 });

        if (error) {
          console.error('Error listing storage:', error);
          return 0;
        }

        if (!items) return 0;

        for (const item of items) {
          const itemPath = path ? `${path}/${item.name}` : item.name;

          if (item.id === null) {
            // C'est un dossier, parcourir récursivement
            totalSize += await calculateFolderSize(itemPath);
          } else {
            // C'est un fichier, ajouter sa taille
            if (item.metadata?.size) {
              totalSize += item.metadata.size;
            } else {
              // Si metadata.size n'est pas disponible, essayer de récupérer les infos du fichier
              try {
                const { data: fileData } = await supabase.storage
                  .from('documents')
                  .list(path, { limit: 1, search: item.name });
                if (fileData && fileData[0]?.metadata?.size) {
                  totalSize += fileData[0].metadata.size;
                }
              } catch {
                // Ignorer les erreurs individuelles
              }
            }
          }
        }

        return totalSize;
      };

      const totalBytes = await calculateFolderSize('');
      const totalMB = totalBytes / (1024 * 1024);
      setStorageUsed(totalMB);
    } catch (error) {
      console.error('Error loading storage usage:', error);
      setStorageUsed(0);
    } finally {
      setLoadingStorage(false);
    }
  };

  // Charger les créneaux disponibles pour le mois en cours + 1 mois
  const loadAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];
      const endDate = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const slots = await dataAdapter.appointments.getAvailableSlots(startDate, endDate);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading available slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Ouvrir la modale de création de client
  const openCreateClientModal = () => {
    setShowCreateClientModal(true);
    loadAvailableSlots();
  };

  // Fonction pour ouvrir le client mail pour le nouveau client
  const openNewClientEmail = (client: { firstName: string; lastName: string; email: string }) => {
    const subject = 'Bienvenue sur votre espace Grapho';
    const body = `Bonjour ${client.firstName},\n\n` +
      `Votre compte patient Grapho a été créé avec succès !\n\n` +
      `Vous pouvez dès à présent vous connecter à votre espace personnel pour consulter vos rendez-vous, documents et messages.\n\n` +
      `📧 Votre email de connexion : ${client.email}\n` +
      `🔑 Votre mot de passe provisoire : Grapho2025\n\n` +
      `⚠️ Pour des raisons de sécurité, vous devrez changer votre mot de passe lors de votre première connexion.\n\n` +
      `Lien de connexion : [VOTRE_URL_DE_CONNEXION]\n\n` +
      `N'hésitez pas à me contacter si vous avez la moindre question.\n\n` +
      `Cordialement,\n` +
      `Philippine Cornet`;

    const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  // Fonction de création de client avec ouverture du client mail
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const createdUser = await dataAdapter.users.create({
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        email: newClient.email,
        phone: newClient.phone,
        role: 'client',
        password: 'Grapho2025',
        passwordResetRequired: true,
      });

      if (createWithAppointment && selectedSlotIndex !== null) {
        const slot = availableSlots[selectedSlotIndex];
        const startDateTime = new Date(`${slot.date}T${slot.startTime}`);
        const endDateTime = new Date(`${slot.date}T${slot.endTime}`);

        await dataAdapter.appointments.create({
          clientId: createdUser.id,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          status: 'scheduled',
          notes: 'Premier rendez-vous',
        });
      }

      openNewClientEmail({
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        email: newClient.email,
      });

      setShowCreateClientModal(false);
      setNewClient({ firstName: '', lastName: '', email: '', phone: '' });
      setCreateWithAppointment(false);
      setSelectedSlotIndex(null);
      setAvailableSlots([]);
      await loadData();
      alert('Client créé avec succès ! Un email pré-rempli s\'est ouvert pour envoyer les identifiants.');
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Erreur lors de la création du client. Vérifiez que l\'email n\'est pas déjà utilisé.');
    }
  };

  const checkAppointmentConflicts = (
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string
  ): Appointment[] => {
    const newStart = new Date(startTime);
    const newEnd = new Date(endTime);

    return appointments.filter(apt => {
      if (apt.status === 'cancelled') return false;
      if (excludeAppointmentId && apt.id === excludeAppointmentId) return false;

      const existingStart = new Date(apt.startTime);
      const existingEnd = new Date(apt.endTime);

      return (
        (newStart >= existingStart && newStart < existingEnd) ||
        (newEnd > existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      );
    });
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = new Date(`${newAppointment.date}T${newAppointment.startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(newAppointment.duration) * 60000);

    const conflicts = checkAppointmentConflicts(
      startDateTime.toISOString(),
      endDateTime.toISOString()
    );

    if (conflicts.length > 0) {
      setConflictingAppointments(conflicts);
      setPendingAction('add');
      setShowConflictModal(true);
      return;
    }

    await createAppointment();
  };

  const createAppointment = async () => {
    try {
      const startDateTime = new Date(`${newAppointment.date}T${newAppointment.startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(newAppointment.duration) * 60000);

      await dataAdapter.appointments.create({
        clientId: newAppointment.clientId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        status: 'scheduled',
        notes: newAppointment.notes,
      });

      setShowAddModal(false);
      setShowConflictModal(false);
      setNewAppointment({ clientId: '', date: '', startTime: '', duration: '60', notes: '' });
      await loadData();
      alert('Rendez-vous créé avec succès !');
    } catch (error) {
      console.error('Error adding appointment:', error);
      alert('Erreur lors de l\'ajout du rendez-vous');
    }
  };

  const handleEditAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    const startDateTime = new Date(`${editAppointment.date}T${editAppointment.startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(editAppointment.duration) * 60000);

    const conflicts = checkAppointmentConflicts(
      startDateTime.toISOString(),
      endDateTime.toISOString(),
      selectedAppointment.id
    );

    if (conflicts.length > 0) {
      setConflictingAppointments(conflicts);
      setPendingAction('edit');
      setShowConflictModal(true);
      return;
    }

    await updateAppointment();
  };

  const updateAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      const startDateTime = new Date(`${editAppointment.date}T${editAppointment.startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(editAppointment.duration) * 60000);

      const originalStatus = appointments.find(apt => apt.id === selectedAppointment.id)?.status;
      const newStatus = selectedAppointment.status;

      await dataAdapter.appointments.update(selectedAppointment.id, {
        clientId: editAppointment.clientId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        status: selectedAppointment.status,
        notes: editAppointment.notes,
      });

      if (originalStatus !== newStatus) {
        const client = clients.find(c => c.id === editAppointment.clientId);
        if (client) {
          const updatedAppointment = {
            ...selectedAppointment,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
          };

          if (newStatus === 'confirmed') {
            openEmailClient(client, updatedAppointment, 'confirmation');
          } else if (newStatus === 'cancelled') {
            openEmailClient(client, updatedAppointment, 'cancellation');
          }
        }
      }

      setShowEditModal(false);
      setShowConflictModal(false);
      setSelectedAppointment(null);
      await loadData();
      alert('Rendez-vous modifié avec succès !');
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Erreur lors de la modification du rendez-vous');
    }
  };

  const handleConfirmWithConflict = async () => {
    if (pendingAction === 'add') {
      await createAppointment();
    } else if (pendingAction === 'edit') {
      await updateAppointment();
    }
    setPendingAction(null);
  };

  const handleCancelConflict = () => {
    setShowConflictModal(false);
    setConflictingAppointments([]);
    setPendingAction(null);
  };

  const handleDeleteAppointment = () => {
    if (!selectedAppointment) return;
    setAppointmentToDelete(selectedAppointment);
    setShowDeleteModal(true);
  };

const confirmDeleteAppointment = async () => {
  if (!appointmentToDelete) return;

  // Récupérer le client AVANT de supprimer (pour l'email)
  const client = clients.find(c => c.id === appointmentToDelete.clientId);
  const appointmentCopy = { ...appointmentToDelete };

  try {
    await dataAdapter.appointments.delete(appointmentToDelete.id);
    setShowDeleteModal(false);
    setShowEditModal(false);
    setAppointmentToDelete(null);
    setSelectedAppointment(null);
    await loadData();
    
    // Ouvrir le client mail pour prévenir le client
    if (client) {
      openEmailClient(client, appointmentCopy, 'deletion');
    }
    
    alert('Rendez-vous supprimé avec succès ! Un email pré-rempli s\'est ouvert pour prévenir le client.');
  } catch (error) {
    console.error('Error deleting appointment:', error);
    alert('Erreur lors de la suppression du rendez-vous');
  }
};


const openEmailClient = (client: User, appointment: Appointment, emailType: 'confirmation' | 'cancellation' | 'deletion') => {
  const startDate = new Date(appointment.startTime);
  const formattedDate = startDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = startDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  let subject = '';
  let body = '';

  if (emailType === 'confirmation') {
    subject = `Confirmation de votre rendez-vous - ${formattedDate}`;
    body = `Bonjour ${client.firstName},\n\n` +
      `Je vous confirme votre rendez-vous de graphothérapie :\n\n` +
      `📅 Date : ${formattedDate}\n` +
      `🕐 Heure : ${formattedTime}\n\n` +
      `N'hésitez pas à me contacter si vous avez des questions.\n\n` +
      `Cordialement,\n` +
      `Philippine Cornet`;
  } else if (emailType === 'cancellation') {
    subject = `Annulation de votre rendez-vous - ${formattedDate}`;
    body = `Bonjour ${client.firstName},\n\n` +
      `Je vous informe que votre rendez-vous de graphothérapie prévu le ${formattedDate} à ${formattedTime} est annulé.\n\n` +
      `N'hésitez pas à me contacter pour convenir d'un nouveau créneau.\n\n` +
      `Cordialement,\n` +
      `Philippine Cornet`;
  } else if (emailType === 'deletion') {
    subject = `Annulation de votre rendez-vous - ${formattedDate}`;
    body = `Bonjour ${client.firstName},\n\n` +
      `Je suis au regret de vous informer que votre rendez-vous de graphothérapie initialement prévu le ${formattedDate} à ${formattedTime} doit être annulé.\n\n` +
      `Je vous prie de m'excuser pour ce désagrément.\n\n` +
      `N'hésitez pas à me contacter pour convenir d'un nouveau créneau qui vous conviendrait.\n\n` +
      `Cordialement,\n` +
      `Philippine Cornet`;
  }

  const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoLink, '_blank');
};


  const openEditModal = (apt: Appointment) => {
    setSelectedAppointment(apt);
    const startDate = new Date(apt.startTime);
    const endDate = new Date(apt.endTime);
    const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

    setEditAppointment({
      clientId: apt.clientId,
      date: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().slice(0, 5),
      duration: duration.toString(),
      notes: apt.notes || '',
    });
    setShowEditModal(true);
  };

  const upcomingAppointments = appointments
    .filter(apt => (apt.status === 'scheduled' || apt.status === 'confirmed') && new Date(apt.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const toConfirmCount = upcomingAppointments.filter(apt => apt.status === 'scheduled').length;

  const totalPages = Math.ceil(upcomingAppointments.length / appointmentsPerPage);
  const startIndex = (currentPage - 1) * appointmentsPerPage;
  const endIndex = startIndex + appointmentsPerPage;
  const currentAppointments = upcomingAppointments.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const myDocuments = documents.filter(doc => user && doc.uploadedBy === user.id);
  const receivedDocuments = documents.filter(doc => user && doc.uploadedBy !== user.id);

  const getAppointmentBorderColor = (status: string): string => {
    switch (status) {
      case 'scheduled':
        return 'border-blue-500';
      case 'confirmed':
        return 'border-green-700';
      case 'cancelled':
        return 'border-red-500';
      case 'completed':
        return 'border-gray-400';
      default:
        return 'border-gray-300';
    }
  };

  // Calcul du pourcentage de stockage utilisé
  const storagePercentage = Math.min((storageUsed / STORAGE_LIMIT_MB) * 100, 100);
  const storageColor = storagePercentage > 80 ? 'bg-red-500' : storagePercentage > 50 ? 'bg-orange-500' : 'bg-green-500';

  // URL du dashboard Supabase du projet
  const supabaseProjectId = getSupabaseProjectId();
  const supabaseDashboardUrl = supabaseProjectId
    ? `https://supabase.com/dashboard/project/${supabaseProjectId}/storage/buckets/documents`
    : 'https://supabase.com/dashboard';

  if (loading) {
    return <div className="py-16 text-center"><p className="font-body text-gray-600">Chargement...</p></div>;
  }

  return (
    <div>
      {/* Section titre - FOND BLANC */}
      <section className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="font-title text-4xl font-bold text-text">Tableau de bord administrateur</h1>
            <Link
              to="/admin/parametres"
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-body text-sm font-semibold text-text"
            >
              Paramètres
            </Link>
          </div>
        </div>
      </section>

      {/* Section cartes stats - FOND COLORÉ */}
      <section className="bg-[#E5B7A4]/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Link
              to="/admin/clients"
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center space-x-3 mb-2">
                <Users className="w-6 h-6 text-primary group-hover:scale-110 transition" />
                <h3 className="font-title text-lg font-bold text-text group-hover:text-primary transition">Clients</h3>
              </div>
              <p className="font-body text-3xl font-bold text-text">{clients.length}</p>
              <p className="font-body text-sm text-gray-600 mt-2">Voir tous les clients</p>
            </Link>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-2">
                <CalendarIcon className="w-6 h-6 text-secondary" />
                <h3 className="font-title text-lg font-bold text-text">RDV à venir</h3>
              </div>
              <p className="font-body text-3xl font-bold text-text">{upcomingAppointments.length}</p>
            </div>

            <Link
              to="/admin/documents"
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center space-x-3 mb-2">
                <FileText className="w-6 h-6 text-primary group-hover:scale-110 transition" />
                <h3 className="font-title text-lg font-bold text-text group-hover:text-primary transition">Documents</h3>
              </div>
              <div className="flex items-baseline space-x-2">
                <p className="font-body text-3xl font-bold text-text">{myDocuments.length}</p>
                <span className="font-body text-sm text-gray-600">déposé(s)</span>
              </div>
              <div className="flex items-baseline space-x-2 mt-1">
                <p className="font-body text-2xl font-bold text-blue-600">{receivedDocuments.length}</p>
                <span className="font-body text-sm text-gray-600">reçu(s)</span>
              </div>
            </Link>

            <Link
              to="/admin/messages"
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center space-x-3 mb-2">
                <MessageSquare className="w-6 h-6 text-primary group-hover:scale-110 transition" />
                <h3 className="font-title text-lg font-bold text-text group-hover:text-primary transition">Messages</h3>
              </div>
              <p className="font-body text-3xl font-bold text-text">{messages.length}</p>
              <p className="font-body text-sm text-gray-600 mt-2">Gérer les messages</p>
            </Link>

            {/* Carte Stockage Supabase */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center space-x-3 mb-2">
                <HardDrive className="w-6 h-6 text-[#E19164]" />
                <h3 className="font-title text-lg font-bold text-text">Stockage</h3>
              </div>
              
              {loadingStorage ? (
                <p className="font-body text-sm text-gray-500">Chargement...</p>
              ) : (
                <>
                  <div className="mb-2">
                    <span className="font-body text-2xl font-bold text-text">
                      {storageUsed.toFixed(1)}
                    </span>
                    <span className="font-body text-sm text-gray-600 ml-1">
                      / {STORAGE_LIMIT_MB} Mo
                    </span>
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${storageColor}`}
                      style={{ width: `${Math.max(storagePercentage, 1)}%` }}
                    />
                  </div>
                  
                  <p className="font-body text-xs text-gray-500 mb-3">
                    {storagePercentage.toFixed(1)}% utilisé
                  </p>
                  
                  <a
                    href={supabaseDashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#E19164] text-white text-xs rounded-lg hover:bg-[#E19164]/90 transition font-body font-semibold"
                  >
                    <span>Passer Pro</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section Calendrier - FOND BLANC */}
      <section className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <h2 className="font-title text-2xl font-bold text-text">Calendrier</h2>
            <div className="flex gap-3">
              <button
                onClick={openCreateClientModal}
                className="flex items-center space-x-2 px-4 py-2 bg-[#E19164] text-white rounded-lg hover:bg-[#E19164]/90 transition font-body font-semibold"
              >
                <UserPlus className="w-5 h-5" />
                <span>Créer un client</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body font-semibold"
              >
                <Plus className="w-5 h-5" />
                <span>Ajouter un RDV</span>
              </button>
            </div>
          </div>
          <Calendar
            appointments={appointments}
            clients={clients}
            onAppointmentClick={openEditModal}
          />
        </div>
      </section>

      {/* Section Prochains RDV - FOND COLORÉ */}
      <section className="bg-[#E5B7A4]/20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="font-title text-2xl font-bold text-text">Prochains rendez-vous</h2>
                {toConfirmCount > 0 && (
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-body font-semibold">
                    {toConfirmCount} à confirmer
                  </span>
                )}
              </div>
              {upcomingAppointments.length > 0 && (
                <span className="text-lg font-normal text-gray-500 font-body">
                  ({upcomingAppointments.length} au total)
                </span>
              )}
            </div>

            {upcomingAppointments.length === 0 ? (
              <p className="font-body text-gray-600 text-center py-8">Aucun rendez-vous à venir</p>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  {currentAppointments.map(apt => {
                    const client = clients.find(c => c.id === apt.clientId);
                    return (
                      <div
                        key={apt.id}
                        className={`border-l-4 ${getAppointmentBorderColor(apt.status)} pl-4 py-3 bg-gray-50 rounded-r-lg flex items-start justify-between group hover:bg-gray-100 transition`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-semibold text-text truncate">
                            {client?.firstName} {client?.lastName}
                          </p>
                          <p className="font-body text-sm text-gray-700 mt-1">
                            {new Date(apt.startTime).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="font-body text-sm text-gray-700">
                            {new Date(apt.startTime).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {apt.notes && (
                            <p className="font-body text-xs text-gray-500 mt-2 italic line-clamp-2">
                              {apt.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => openEditModal(apt)}
                            className="p-2 hover:bg-blue-100 rounded-lg transition"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => {
                              setAppointmentToDelete(apt);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 hover:bg-red-100 rounded-lg transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t gap-4">
                    <p className="font-body text-sm text-gray-600 text-center sm:text-left">
                      Page {currentPage} sur {totalPages} • {startIndex + 1}-{Math.min(endIndex, upcomingAppointments.length)} sur {upcomingAppointments.length}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg font-body text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Précédent
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg font-body text-sm hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* MODALE : Création de client */}
      {showCreateClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-title text-2xl font-bold text-text">Créer un nouveau client</h3>
              <button
                onClick={() => {
                  setShowCreateClientModal(false);
                  setNewClient({ firstName: '', lastName: '', email: '', phone: '' });
                  setCreateWithAppointment(false);
                  setSelectedSlotIndex(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-6">
              <div className="bg-[#E5B7A4]/10 rounded-lg p-4 space-y-4">
                <h4 className="font-body font-semibold text-text">Informations du client</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-sm font-medium text-text mb-2">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={newClient.firstName}
                      onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                      placeholder="Jean"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-sm font-medium text-text mb-2">Nom *</label>
                    <input
                      type="text"
                      required
                      value={newClient.lastName}
                      onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                      placeholder="Dupont"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-sm font-medium text-text mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                      placeholder="jean.dupont@example.com"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-sm font-medium text-text mb-2">Téléphone *</label>
                    <input
                      type="tel"
                      required
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="font-body text-sm text-blue-800">
                    <strong>Mot de passe provisoire :</strong> Grapho2025 (le client devra le changer à sa première connexion)
                  </p>
                </div>
              </div>

              <div className="bg-[#E5B7A4]/10 rounded-lg p-4 space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createWithAppointment}
                    onChange={(e) => setCreateWithAppointment(e.target.checked)}
                    className="w-5 h-5 text-primary focus:ring-2 focus:ring-primary rounded"
                  />
                  <span className="font-body font-semibold text-text">Créer un premier rendez-vous</span>
                </label>

                {createWithAppointment && (
                  <div className="mt-4 space-y-3">
                    <h4 className="font-body font-semibold text-text">Choisir un créneau disponible</h4>

                    {loadingSlots ? (
                      <p className="font-body text-sm text-gray-600">Chargement des créneaux disponibles...</p>
                    ) : availableSlots.length === 0 ? (
                      <p className="font-body text-sm text-orange-600">Aucun créneau disponible pour les 60 prochains jours.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-white">
                        {availableSlots.map((slot, index) => {
                          const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
                          const isSelected = selectedSlotIndex === index;

                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedSlotIndex(index);
                              }}
                              className={`p-3 border-2 rounded-lg text-left transition ${
                                isSelected
                                  ? 'border-primary bg-primary/10'
                                  : 'border-gray-300 hover:border-primary/50 bg-white'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-body text-sm font-semibold text-text">
                                    {slotDateTime.toLocaleDateString('fr-FR', {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                    })}
                                  </p>
                                  <p className="font-body text-xs text-gray-600">
                                    {slot.startTime}
                                  </p>
                                </div>
                                {isSelected && (
                                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {selectedSlotIndex !== null && availableSlots[selectedSlotIndex] && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="font-body text-sm text-green-800">
                          <strong>Créneau sélectionné :</strong>{' '}
                          {new Date(`${availableSlots[selectedSlotIndex].date}T${availableSlots[selectedSlotIndex].startTime}`).toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}{' '}
                          à {availableSlots[selectedSlotIndex].startTime}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateClientModal(false);
                    setNewClient({ firstName: '', lastName: '', email: '', phone: '' });
                    setCreateWithAppointment(false);
                    setSelectedSlotIndex(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-body"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createWithAppointment && selectedSlotIndex === null}
                  className="flex-1 px-4 py-2 bg-[#E19164] text-white rounded-lg hover:bg-[#E19164]/90 transition font-body font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Créer le client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale de confirmation de suppression */}
      {showDeleteModal && appointmentToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-12 h-12 text-red-600" />
              </div>
            </div>

            <h3 className="font-title text-2xl font-bold text-text text-center mb-2">
              Supprimer ce rendez-vous ?
            </h3>

            <p className="font-body text-center text-gray-600 mb-6">
              Cette action est irréversible. Le rendez-vous sera définitivement supprimé.
            </p>

            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
              <p className="font-body text-sm text-gray-700 mb-2">
                <strong>Client :</strong> {clients.find(c => c.id === appointmentToDelete.clientId)?.firstName} {clients.find(c => c.id === appointmentToDelete.clientId)?.lastName}
              </p>
              <p className="font-body text-sm text-gray-700 mb-2">
                <strong>Date :</strong> {new Date(appointmentToDelete.startTime).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              <p className="font-body text-sm text-gray-700">
                <strong>Heure :</strong> {new Date(appointmentToDelete.startTime).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })} - {new Date(appointmentToDelete.endTime).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setAppointmentToDelete(null);
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-body font-semibold hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteAppointment}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-body font-semibold hover:bg-red-700 transition shadow-md hover:shadow-lg"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'alerte de conflit */}
      {showConflictModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start space-x-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-title text-xl font-bold text-text mb-1">
                  Conflit de rendez-vous détecté
                </h3>
                <p className="font-body text-sm text-gray-600">
                  Ce créneau chevauche {conflictingAppointments.length} rendez-vous existant(s).
                </p>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <h4 className="font-body font-semibold text-text mb-3">
                Rendez-vous en conflit :
              </h4>
              <div className="space-y-3">
                {conflictingAppointments.map(apt => {
                  const client = clients.find(c => c.id === apt.clientId);
                  return (
                    <div key={apt.id} className="bg-white border border-orange-300 rounded-lg p-3">
                      <p className="font-body font-semibold text-text">
                        {client?.firstName} {client?.lastName}
                      </p>
                      <p className="font-body text-sm text-gray-700 mt-1">
                        {new Date(apt.startTime).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="font-body text-sm text-gray-700">
                        {new Date(apt.startTime).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} - {new Date(apt.endTime).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      {apt.notes && (
                        <p className="font-body text-xs text-gray-600 mt-2 italic">
                          Note : {apt.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4">
              <p className="font-body text-sm text-yellow-800">
                <strong>Attention :</strong> Créer ce rendez-vous peut entraîner des doubles réservations. Voulez-vous continuer malgré tout ?
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancelConflict}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-body font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmWithConflict}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-body font-semibold"
              >
                Créer quand même
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de modification */}
      {showEditModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-title text-2xl font-bold text-text">Modifier le rendez-vous</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditAppointment} className="space-y-4">
              <div>
                <label className="block font-body text-sm font-medium text-text mb-2">Client *</label>
                <select
                  required
                  value={editAppointment.clientId}
                  onChange={(e) => setEditAppointment({ ...editAppointment, clientId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-body text-sm font-medium text-text mb-2">Statut *</label>
                <select
                  required
                  value={selectedAppointment?.status || 'scheduled'}
                  onChange={(e) => {
                    if (selectedAppointment) {
                      setSelectedAppointment({
                        ...selectedAppointment,
                        status: e.target.value as 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
                      });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                >
                  <option value="scheduled">Prévu</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>

              <div>
                <label className="block font-body text-sm font-medium text-text mb-2">Date *</label>
                <input
                  type="date"
                  required
                  value={editAppointment.date}
                  onChange={(e) => setEditAppointment({ ...editAppointment, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">Heure *</label>
                  <input
                    type="time"
                    required
                    value={editAppointment.startTime}
                    onChange={(e) => setEditAppointment({ ...editAppointment, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">Durée (min) *</label>
                  <input
                    type="number"
                    required
                    min="15"
                    step="15"
                    value={editAppointment.duration}
                    onChange={(e) => setEditAppointment({ ...editAppointment, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  />
                </div>
              </div>

              <div>
                <label className="block font-body text-sm font-medium text-text mb-2">Notes</label>
                <textarea
                  rows={3}
                  value={editAppointment.notes}
                  onChange={(e) => setEditAppointment({ ...editAppointment, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleDeleteAppointment}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-body font-semibold flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-body"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body font-semibold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-title text-2xl font-bold text-text">Nouveau rendez-vous</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAppointment} className="space-y-4">
              <div>
                <label className="block font-body text-sm font-medium text-text mb-2">Client *</label>
                <select
                  required
                  value={newAppointment.clientId}
                  onChange={(e) => setNewAppointment({ ...newAppointment, clientId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-body text-sm font-medium text-text mb-2">Date *</label>
                <input
                  type="date"
                  required
                  value={newAppointment.date}
                  onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">Heure *</label>
                  <input
                    type="time"
                    required
                    value={newAppointment.startTime}
                    onChange={(e) => setNewAppointment({ ...newAppointment, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">Durée (min) *</label>
                  <input
                    type="number"
                    required
                    min="15"
                    step="15"
                    value={newAppointment.duration}
                    onChange={(e) => setNewAppointment({ ...newAppointment, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  />
                </div>
              </div>

              <div>
                <label className="block font-body text-sm font-medium text-text mb-2">Notes</label>
                <textarea
                  rows={3}
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-body"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body font-semibold"
                >
                  Créer le RDV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


