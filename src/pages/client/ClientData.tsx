import { useState } from 'react';
import { Download, Trash2, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataAdapter } from '../../lib/data';

export function ClientData() {
  const { user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExportData = async () => {
    if (!user) return;

    try {
      const [appointments, documents, messages, consents] = await Promise.all([
        dataAdapter.appointments.getByClientId(user.id),
        dataAdapter.documents.getByUserId(user.id),
        dataAdapter.messages.getByUserId(user.id),
        dataAdapter.consents.getByUserId(user.id),
      ]);

      const exportData = {
        user,
        appointments,
        documents,
        messages,
        consents,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mes-donnees-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('Vos données ont été exportées avec succès !');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Erreur lors de l\'export des données');
    }
  };

  const handleDeleteRequest = () => {
    alert('Votre demande de suppression a été enregistrée. Nous vous contacterons dans les 48h.');
    setShowDeleteConfirm(false);
  };

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-title text-4xl font-bold text-text mb-8">Mes données personnelles</h1>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start space-x-4 mb-4">
              <Shield className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <h2 className="font-title text-2xl font-bold text-text mb-2">Protection de vos données</h2>
                <p className="font-body text-gray-700">
                  Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-title text-xl font-bold text-text mb-4">Exporter mes données</h3>
            <p className="font-body text-gray-700 mb-4">
              Téléchargez une copie de toutes vos données personnelles au format JSON.
            </p>
            <button
              onClick={handleExportData}
              className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger mes données</span>
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-title text-xl font-bold text-text mb-4">Supprimer mes données</h3>
            <p className="font-body text-gray-700 mb-4">
              Vous pouvez demander la suppression définitive de toutes vos données personnelles. Cette action est irréversible.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-body"
              >
                <Trash2 className="w-4 h-4" />
                <span>Demander la suppression</span>
              </button>
            ) : (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <p className="font-body text-red-800 mb-4">
                  <strong>Attention :</strong> Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteRequest}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-body"
                  >
                    Confirmer la suppression
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-body"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <p className="font-body text-sm text-blue-700">
              Pour toute question concernant vos données personnelles, contactez-nous à{' '}
              <a href="mailto:contact@graphotherapie.fr" className="underline">
                contact@graphotherapie.fr
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
