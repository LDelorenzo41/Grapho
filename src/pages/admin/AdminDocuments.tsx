import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Upload, Eye, Users, User as UserIcon, ArrowLeft, Download, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataAdapter, type Document, type User, type DocumentVisibility } from '../../lib/data';
import { uploadFile, downloadFile, deleteFile } from '../../lib/storage';

export function AdminDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [visibility, setVisibility] = useState<DocumentVisibility>('specific');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Nouveaux états pour la modale de configuration pré-upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('Documents administratifs');
  const [uploadVisibility, setUploadVisibility] = useState<DocumentVisibility>('specific');
  const [uploadSelectedUsers, setUploadSelectedUsers] = useState<string[]>([]);

  // ✅ NOUVEAU : État pour la modale de confirmation de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);

  // Liste de catégories prédéfinies
  const categories = [
    'Documents administratifs',
    'Bilans',
    'Documents médicaux',
    'Éxercices',
    'Comptes rendus',
    'Autre',
  ];

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

  // Nouvelle fonction : ouvre la modale au lieu d'uploader directement
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setPendingFile(file);
    setShowUploadModal(true);
    
    // Réinitialiser les valeurs par défaut
    setUploadCategory('Documents administratifs');
    setUploadVisibility('specific');
    setUploadSelectedUsers([]);
    
    // Réinitialiser l'input file pour pouvoir resélectionner le même fichier
    e.target.value = '';
  };

  // Nouvelle fonction : confirme l'upload avec les paramètres configurés
  const handleConfirmUpload = async () => {
    if (!user || !pendingFile) return;

    setUploading(true);

    try {
      // 1. Upload le fichier vers Supabase Storage
      const filePath = await uploadFile(pendingFile, user.id);

      // 2. Créer l'entrée dans la base de données avec les paramètres choisis
      const newDoc = await dataAdapter.documents.create({
        userId: user.id,
        uploadedBy: user.id,
        fileName: pendingFile.name,
        fileType: pendingFile.type,
        fileSize: pendingFile.size,
        filePath: filePath,
        category: uploadCategory,
        visibility: uploadVisibility,
        visibleToUserIds: uploadVisibility === 'specific' ? uploadSelectedUsers : undefined,
      });
      
      setDocuments([newDoc, ...documents]);
      setShowUploadModal(false);
      setPendingFile(null);
      alert('Document ajouté avec succès !');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Erreur lors de l\'ajout du document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      await downloadFile(doc.filePath, doc.fileName);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Erreur lors du téléchargement');
    }
  };

  // ✅ NOUVELLE VERSION : Ouvrir la modale de confirmation au lieu de window.confirm()
  const handleDelete = (doc: Document) => {
    setDocumentToDelete(doc);
    setShowDeleteModal(true);
  };

  // ✅ NOUVEAU : Confirmer la suppression
  const confirmDeleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      // 1. Supprimer le fichier du storage
      await deleteFile(documentToDelete.filePath);

      // 2. Supprimer l'entrée de la base de données
      await dataAdapter.documents.delete(documentToDelete.id);

      // 3. Mettre à jour l'état local
      setDocuments(documents.filter(d => d.id !== documentToDelete.id));
      setShowDeleteModal(false);
      setDocumentToDelete(null);
      alert('Document supprimé avec succès !');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Erreur lors de la suppression du document');
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
            <span>Ajouter un document</span>
            <input
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {(() => {
          const receivedDocs = documents.filter(d => user && d.uploadedBy !== user.id);
          const adminDocs = documents.filter(d => user && d.uploadedBy === user.id);

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
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDownload(doc)}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                title="Télécharger"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(doc)}
                                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
              </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}

        {/* ✅ NOUVELLE MODALE : Confirmation de suppression */}
        {showDeleteModal && documentToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
              {/* Icône d'alerte */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-12 h-12 text-red-600" />
                </div>
              </div>

              {/* Titre */}
              <h3 className="font-title text-2xl font-bold text-text text-center mb-2">
                Supprimer ce document ?
              </h3>

              {/* Message */}
              <p className="font-body text-center text-gray-600 mb-6">
                Cette action est irréversible. Le document sera définitivement supprimé du stockage.
              </p>

              {/* Détails du document */}
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
                <p className="font-body text-sm text-gray-700 mb-2">
                  <strong>Fichier :</strong> {documentToDelete.fileName}
                </p>
                <p className="font-body text-sm text-gray-700 mb-2">
                  <strong>Catégorie :</strong> {documentToDelete.category}
                </p>
                <p className="font-body text-sm text-gray-700">
                  <strong>Taille :</strong> {(documentToDelete.fileSize / 1024).toFixed(1)} KB
                </p>
              </div>

              {/* Avertissement */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="font-body text-xs text-yellow-800">
                  ⚠️ <strong>Attention :</strong> Si ce document est partagé avec des clients, ils n'y auront plus accès.
                </p>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDocumentToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-body font-semibold hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteDocument}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-body font-semibold hover:bg-red-700 transition shadow-md hover:shadow-lg"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modale de configuration AVANT l'upload */}
        {showUploadModal && pendingFile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="font-title text-2xl font-bold text-text mb-2">
                Configurer le document
              </h3>
              <p className="font-body text-sm text-gray-600 mb-6">
                Fichier : <strong>{pendingFile.name}</strong> ({(pendingFile.size / 1024).toFixed(1)} KB)
              </p>

              {/* Sélection de la catégorie */}
              <div className="mb-6">
                <label className="block font-body font-semibold text-text mb-2">
                  Catégorie du document
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-body focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Sélection de la visibilité */}
              <div className="mb-6">
                <label className="block font-body font-semibold text-text mb-2">
                  Qui peut voir ce document ?
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={uploadVisibility === 'all'}
                      onChange={() => setUploadVisibility('all')}
                      className="w-4 h-4"
                    />
                    <span className="font-body">Visible par tous (public)</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={uploadVisibility === 'clients'}
                      onChange={() => setUploadVisibility('clients')}
                      className="w-4 h-4"
                    />
                    <span className="font-body">Tous les clients</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={uploadVisibility === 'specific'}
                      onChange={() => setUploadVisibility('specific')}
                      className="w-4 h-4"
                    />
                    <span className="font-body">Personnes spécifiques</span>
                  </label>

                  {uploadVisibility === 'specific' && (
                    <div className="ml-7 space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                      {clients.length === 0 ? (
                        <p className="font-body text-sm text-gray-500">Aucun client disponible</p>
                      ) : (
                        clients.map(client => (
                          <label key={client.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={uploadSelectedUsers.includes(client.id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setUploadSelectedUsers([...uploadSelectedUsers, client.id]);
                                } else {
                                  setUploadSelectedUsers(uploadSelectedUsers.filter(id => id !== client.id));
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <span className="font-body text-sm">{client.firstName} {client.lastName}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Validation de sélection pour "specific" */}
              {uploadVisibility === 'specific' && uploadSelectedUsers.length === 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="font-body text-sm text-yellow-800">
                    ⚠️ Veuillez sélectionner au moins un destinataire
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={handleConfirmUpload}
                  disabled={uploading || (uploadVisibility === 'specific' && uploadSelectedUsers.length === 0)}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Ajout en cours...' : 'Ajouter le document'}
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setPendingFile(null);
                  }}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-body disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modale de modification de visibilité (existante) */}
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