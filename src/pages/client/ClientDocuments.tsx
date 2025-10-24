import { useEffect, useState } from 'react';
import { FileText, Upload, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataAdapter, type Document } from '../../lib/data';
import { uploadFile, downloadFile } from '../../lib/storage';

export function ClientDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadDocuments = async () => {
      if (!user) return;
      try {
        const docs = await dataAdapter.documents.getVisibleToUser(user.id, user.role);
        setDocuments(docs);
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDocuments();
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      // 1. Upload le fichier vers Supabase Storage
      const filePath = await uploadFile(file, user.id);

      // 2. Récupérer l'admin pour l'ajouter aux visibleToUserIds
      const allUsers = await dataAdapter.users.getAll();
      const admin = allUsers.find(u => u.role === 'admin');

      const visibleToUsers = [user.id];
      if (admin) {
        visibleToUsers.push(admin.id);
      }

      // 3. Créer l'entrée dans la base de données
      const newDoc = await dataAdapter.documents.create({
        userId: user.id,
        uploadedBy: user.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        filePath: filePath,
        category: 'Documents clients',
        visibility: 'specific',
        visibleToUserIds: visibleToUsers,
      });
      setDocuments([newDoc, ...documents]);
      alert('Document déposé avec succès ! Votre graphothérapeute peut maintenant le consulter.');
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Erreur lors du dépôt du document');
    } finally {
      setUploading(false);
      e.target.value = '';
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return <div className="py-16 text-center"><p className="font-body text-gray-600">Chargement...</p></div>;
  }

  // Séparer les documents selon qui les a uploadés
  const myUploadedDocs = documents.filter(doc => doc.uploadedBy === user?.id);
  const receivedDocs = documents.filter(doc => doc.uploadedBy !== user?.id);

  return (
    <div className="py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-title text-4xl font-bold text-text">Mes documents</h1>
          <label className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition cursor-pointer font-body">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Dépôt en cours...' : 'Déposer un document'}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
          </label>
        </div>

        {receivedDocs.length > 0 && (
          <div className="mb-8">
            <h2 className="font-title text-2xl font-bold text-text mb-4">Documents reçus</h2>
            <div className="grid grid-cols-1 gap-4">
              {receivedDocs.map(doc => (
                <div key={doc.id} className="bg-green-50 rounded-lg shadow-sm border-2 border-green-200 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-body font-semibold text-text truncate text-sm sm:text-base">{doc.fileName}</h3>
                        <p className="font-body text-xs sm:text-sm text-gray-600">{formatFileSize(doc.fileSize)}</p>
                        {doc.category && (
                          <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            {doc.category}
                          </span>
                        )}
                        <p className="font-body text-xs text-gray-500 mt-2">
                          Reçu le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="self-end sm:self-start flex-shrink-0 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-body flex items-center space-x-2"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Télécharger</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="font-title text-2xl font-bold text-text mb-4">Mes documents envoyés</h2>
        {myUploadedDocs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="font-body text-gray-600">Aucun document envoyé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {myUploadedDocs.map(doc => (
              <div key={doc.id} className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-body font-semibold text-text truncate text-sm sm:text-base">{doc.fileName}</h3>
                      <p className="font-body text-xs sm:text-sm text-gray-600">{formatFileSize(doc.fileSize)}</p>
                      {doc.category && (
                        <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {doc.category}
                        </span>
                      )}
                      <p className="font-body text-xs text-gray-500 mt-2">
                        Envoyé le {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="self-end sm:self-start flex-shrink-0 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-body flex items-center space-x-2"
                    title="Télécharger"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Télécharger</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
