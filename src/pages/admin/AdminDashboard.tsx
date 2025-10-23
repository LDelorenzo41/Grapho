import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar as CalendarIcon, FileText, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { dataAdapter, type User, type Appointment } from '../../lib/data';
import { Calendar } from '../../components/Calendar/Calendar';

export function AdminDashboard() {
  const [clients, setClients] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allUsers, allAppts] = await Promise.all([
        dataAdapter.users.getAll(),
        dataAdapter.appointments.getAll(),
      ]);
      setClients(allUsers.filter(u => u.role === 'client'));
      setAppointments(allAppts);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setNewAppointment({ clientId: '', date: '', startTime: '', duration: '60', notes: '' });
      await loadData();
    } catch (error) {
      console.error('Error adding appointment:', error);
      alert('Erreur lors de l\'ajout du rendez-vous');
    }
  };

  const handleEditAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    try {
      const startDateTime = new Date(`${editAppointment.date}T${editAppointment.startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(editAppointment.duration) * 60000);

      await dataAdapter.appointments.update(selectedAppointment.id, {
        clientId: editAppointment.clientId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: editAppointment.notes,
      });

      setShowEditModal(false);
      setSelectedAppointment(null);
      await loadData();
      alert('Rendez-vous modifié avec succès !');
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Erreur lors de la modification du rendez-vous');
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointment) return;
    if (!confirm('Voulez-vous vraiment supprimer ce rendez-vous ?')) return;

    try {
      await dataAdapter.appointments.delete(selectedAppointment.id);
      setShowEditModal(false);
      setSelectedAppointment(null);
      await loadData();
      alert('Rendez-vous supprimé avec succès !');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Erreur lors de la suppression du rendez-vous');
    }
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

  const upcomingAppointments = appointments.filter(apt =>
    apt.status === 'scheduled' && new Date(apt.startTime) > new Date()
  );

  if (loading) {
    return <div className="py-16 text-center"><p className="font-body text-gray-600">Chargement...</p></div>;
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-title text-4xl font-bold text-text">Tableau de bord administrateur</h1>
          <Link
            to="/admin/parametres"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-body text-sm font-semibold text-text"
          >
            Paramètres
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/admin/clients"
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-6 h-6 text-primary group-hover:scale-110 transition" />
              <h3 className="font-title text-lg font-bold text-text group-hover:text-primary transition">Clients</h3>
            </div>
            <p className="font-body text-3xl font-bold text-text">{clients.length}</p>
            <p className="font-body text-sm text-gray-600 mt-2">Voir tous les clients →</p>
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
            <p className="font-body text-3xl font-bold text-text">{appointments.length}</p>
            <p className="font-body text-sm text-gray-600 mt-2">Gérer les documents →</p>
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-title text-2xl font-bold text-text">Calendrier</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>Ajouter un RDV</span>
            </button>
          </div>
          <Calendar
            appointments={appointments}
            clients={clients}
            onAppointmentClick={openEditModal}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="font-title text-2xl font-bold text-text mb-4">Prochains rendez-vous</h2>
          {upcomingAppointments.length === 0 ? (
            <p className="font-body text-gray-600">Aucun rendez-vous à venir</p>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 5).map(apt => {
                const client = clients.find(c => c.id === apt.clientId);
                return (
                  <div key={apt.id} className="border-l-4 border-primary pl-4 py-2 flex items-center justify-between group">
                    <div>
                      <p className="font-body font-semibold text-text">
                        {client?.firstName} {client?.lastName}
                      </p>
                      <p className="font-body text-sm text-gray-600">
                        {new Date(apt.startTime).toLocaleString('fr-FR')}
                      </p>
                      {apt.notes && (
                        <p className="font-body text-xs text-gray-500 mt-1">{apt.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => openEditModal(apt)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Voulez-vous vraiment supprimer ce rendez-vous ?')) {
                            try {
                              await dataAdapter.appointments.delete(apt.id);
                              await loadData();
                              alert('Rendez-vous supprimé avec succès !');
                            } catch (error) {
                              console.error('Error deleting appointment:', error);
                              alert('Erreur lors de la suppression');
                            }
                          }
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
          )}
        </div>

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
    </div>
  );
}
