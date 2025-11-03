import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Mail, Phone, ChevronRight, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { dataAdapter, type User, type ClientStatus } from '../../lib/data';

export function AdminClients() {
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  // ✅ NOUVEAU : État pour le filtre de statut
  const [statusFilter, setStatusFilter] = useState<'all' | ClientStatus>('all');

  useEffect(() => {
    const loadClients = async () => {
      try {
        const allUsers = await dataAdapter.users.getAll();
        setClients(allUsers.filter(u => u.role === 'client'));
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, []);

  // ✅ NOUVEAU : Filtrer les clients selon le statut sélectionné
  const filteredClients = clients.filter(client => {
    if (statusFilter === 'all') return true;
    return client.status === statusFilter;
  });

  if (loading) {
    return <div className="py-16 text-center"><p className="font-body text-gray-600">Chargement...</p></div>;
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4 mb-8">
          <Link
            to="/admin/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-title text-4xl font-bold text-text">Clients</h1>
        </div>

        {/* ✅ NOUVEAU : Boutons de filtre par statut */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg font-body font-medium transition ${
              statusFilter === 'all'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Tous ({clients.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-2 rounded-lg font-body font-medium transition flex items-center gap-2 ${
              statusFilter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Actifs ({clients.filter(c => c.status === 'active' || !c.status).length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 rounded-lg font-body font-medium transition flex items-center gap-2 ${
              statusFilter === 'completed'
                ? 'bg-gray-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <XCircle className="w-4 h-4" />
            Terminés ({clients.filter(c => c.status === 'completed').length})
          </button>
        </div>

        {filteredClients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="font-body text-gray-600">
              {statusFilter === 'all' 
                ? 'Aucun client' 
                : `Aucun client avec le statut "${statusFilter === 'active' ? 'Actif' : 'Terminée'}"`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredClients.map(client => (
              <Link
                key={client.id}
                to={`/admin/clients/${client.id}`}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-title text-xl font-bold text-text group-hover:text-primary transition">
                        {client.firstName} {client.lastName}
                      </h3>
                      {/* ✅ NOUVEAU : Badge de statut */}
                      {client.status === 'completed' ? (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Terminée
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Actif
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 font-body text-sm text-gray-700">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-primary" />
                        <span>{client.email}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-primary" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.dateOfBirth && (
                        <p className="text-gray-600">
                          Né(e) le {new Date(client.dateOfBirth).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                      <p className="text-gray-500 text-xs mt-2">
                        Inscrit le {new Date(client.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
