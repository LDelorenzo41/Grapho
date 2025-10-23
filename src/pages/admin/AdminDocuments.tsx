import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, Eye, Users, User as UserIcon, ArrowLeft } from 'lucide-react';
import { dataAdapter, type Document, type User, type DocumentVisibility } from '../../lib/data';

export function AdminDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [visibility, setVisibility] = useState<DocumentVisibility>('specific');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [docs, allUsers] = await Promise.all([
        dataAdapter.documents.getAll(),
        dataAdapter.users.getAll(),
      ]);
      setDocuments(docs);
      setClients(allUsers.filter(u => u.role === 'client'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const newDoc = await dataAdapter.documents.create({
        userId: 'admin-1',
        uploadedBy: 'admin-1',
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        category: 'Documents administratifs',
        visibility: 'all',
      });
      setDocuments([newDoc, ...documents]);
      alert('Document ajouté avec succès !');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Erreur lors de l\'ajout du document');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleUpdateVisibility = async () => {
    if (!editingDoc) return;

    try {
      const updated = await dataAdapter.documents.update(editingDoc.id, {
        visibility,
        visibleToUserIds: visibility === 'specific' ? selectedUsers : undefined,
      });
      setDocuments(documents.map(d => d.id === updated.id ? updated : d));
      setEditingDoc(null);
      alert('Visibilité mise à jour !');
    } catch (error) {
      console.error('Error updating visibility:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  if (loading) {
    return <div className="py-16 text-center"><p className="font-body text-gray-600">Chargement...</p></div>;
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to="/admin/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-title text-4xl font-bold text-text">Gestion documentaire</h1>
          </div>
          <label className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition cursor-pointer font-body">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Ajout...' : 'Ajouter un document'}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {(() => {
          const receivedDocs = documents.filter(d => d.uploadedBy !== 'admin-1');
          const adminDocs = documents.filter(d => d.uploadedBy === 'admin-1');

          return (
            <>
              {receivedDocs.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-title text-2xl font-bold text-text mb-4">Documents reçus</h2>
                  <div className="space-y-4">
                    {receivedDocs.map(doc => {
                      const uploader = clients.find(c => c.id === doc.uploadedBy);
                      return (
                        <div key={doc.id} className="bg-blue-50 rounded-lg shadow-sm border-2 border-blue-200 p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-body font-semibold text-text mb-1">{doc.fileName}</h3>
                                <p className="font-body text-sm text-gray-700 mb-2">
                                  Envoyé par <strong>{uploader?.firstName} {uploader?.lastName}</strong>
                                </p>
                                <p className="font-body text-sm text-gray-600 mb-2">
                                  {(doc.fileSize / 1024).toFixed(1)} KB • {doc.category}
                                </p>
                                <p className="font-body text-xs text-gray-500">
                                  Reçu le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <h2 className="font-title text-2xl font-bold text-text mb-4">Mes documents</h2>
              {adminDocs.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="font-body text-gray-600">Aucun document</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {adminDocs.map(doc => (
              <div key={doc.id} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-body font-semibold text-text mb-1">{doc.fileName}</h3>
                      <p className="font-body text-sm text-gray-600 mb-2">
                        {(doc.fileSize / 1024).toFixed(1)} KB • {doc.category}
                      </p>
                      <div className="flex items-center space-x-2">
                        {doc.visibility === 'all' && (
                          <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            <Eye className="w-3 h-3" />
                            <span>Visible par tous</span>
                          </span>
                        )}
                        {doc.visibility === 'clients' && (
                          <span className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            <Users className="w-3 h-3" />
                            <span>Tous les clients</span>
                          </span>
                        )}
                        {doc.visibility === 'specific' && (
                          <span className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                            <UserIcon className="w-3 h-3" />
                            <span>{doc.visibleToUserIds?.length || 0} personne(s)</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setEditingDoc(doc);
                      setVisibility(doc.visibility);
                      setSelectedUsers(doc.visibleToUserIds || []);
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition font-body text-sm"
                  >
                    Modifier visibilité
                  </button>
                </div>
              </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}

        {editingDoc && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <h3 className="font-title text-2xl font-bold text-text mb-4">
                Modifier la visibilité
              </h3>
              <div className="space-y-4 mb-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={visibility === 'all'}
                    onChange={() => setVisibility('all')}
                    className="w-4 h-4"
                  />
                  <span className="font-body">Visible par tous (public)</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={visibility === 'clients'}
                    onChange={() => setVisibility('clients')}
                    className="w-4 h-4"
                  />
                  <span className="font-body">Tous les clients</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    checked={visibility === 'specific'}
                    onChange={() => setVisibility('specific')}
                    className="w-4 h-4"
                  />
                  <span className="font-body">Personnes spécifiques</span>
                </label>

                {visibility === 'specific' && (
                  <div className="ml-7 space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {clients.map(client => (
                      <label key={client.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(client.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, client.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== client.id));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="font-body text-sm">{client.firstName} {client.lastName}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleUpdateVisibility}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => setEditingDoc(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-body"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
