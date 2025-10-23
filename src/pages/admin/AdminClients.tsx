import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Mail, Phone, ChevronRight, ArrowLeft } from 'lucide-react';
import { dataAdapter, type User } from '../../lib/data';

export function AdminClients() {
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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

        {clients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="font-body text-gray-600">Aucun client</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clients.map(client => (
              <Link
                key={client.id}
                to={`/admin/clients/${client.id}`}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-title text-xl font-bold text-text mb-3 group-hover:text-primary transition">
                      {client.firstName} {client.lastName}
                    </h3>
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
