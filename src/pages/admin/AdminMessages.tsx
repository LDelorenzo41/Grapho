import { useEffect, useState } from 'react';
import { MessageSquare, Plus, X, Edit2, Trash2, Send, Users, User, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataAdapter, type Message, type User as UserType } from '../../lib/data';

export function AdminMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [clients, setClients] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // ✅ NOUVEAU : État pour la modale de confirmation de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);

  // ✅ NOUVEAU : États pour la sélection multiple et suppression en lot
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const [composeForm, setComposeForm] = useState({
    recipientId: '',
    selectAll: false,
    subject: '',
    content: '',
  });

  const [editForm, setEditForm] = useState({
    subject: '',
    content: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allUsers, allMessages] = await Promise.all([
        dataAdapter.users.getAll(),
        dataAdapter.messages.getAll(),
      ]);
      // ✅ MODIFIÉ : Filtrer uniquement les clients avec statut 'active'
      setClients(allUsers.filter(u => u.role === 'client' && (u.status === 'active' || !u.status)));
      // Filter messages sent by admin
      setMessages(allMessages.filter(m => user && m.senderId === user.id));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (composeForm.selectAll) {
        // Send to all clients
        await Promise.all(
          clients.map(client =>
            dataAdapter.messages.create({
              senderId: user.id,
              recipientId: client.id,
              subject: composeForm.subject,
              content: composeForm.content,
              read: false,
            })
          )
        );
        alert(`Message envoyé à ${clients.length} client(s) avec succès !`);
      } else {
        // Send to one client
        await dataAdapter.messages.create({
          senderId: user.id,
          recipientId: composeForm.recipientId,
          subject: composeForm.subject,
          content: composeForm.content,
          read: false,
        });
        alert('Message envoyé avec succès !');
      }

      setShowComposeModal(false);
      setComposeForm({ recipientId: '', selectAll: false, subject: '', content: '' });
      await loadData();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erreur lors de l\'envoi du message');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage) return;

    try {
      await dataAdapter.messages.update(selectedMessage.id, {
        subject: editForm.subject,
        content: editForm.content,
      });
      alert('Message modifié avec succès !');
      setShowEditModal(false);
      setSelectedMessage(null);
      await loadData();
    } catch (error) {
      console.error('Error updating message:', error);
      alert('Erreur lors de la modification du message');
    }
  };

  // ✅ NOUVELLE VERSION : Ouvrir la modale de confirmation au lieu de confirm()
  const handleDelete = (message: Message) => {
    setMessageToDelete(message);
    setShowDeleteModal(true);
  };

  // ✅ NOUVEAU : Confirmer la suppression
  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      await dataAdapter.messages.delete(messageToDelete.id);
      setShowDeleteModal(false);
      setMessageToDelete(null);
      await loadData();
      alert('Message supprimé avec succès !');
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Erreur lors de la suppression du message');
    }
  };

  // ✅ NOUVEAU : Gérer la sélection/désélection d'un message
  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  // ✅ NOUVEAU : Sélectionner/désélectionner tous les messages
  const toggleSelectAll = () => {
    if (selectedMessages.length === messages.length) {
      setSelectedMessages([]);
    } else {
      setSelectedMessages(messages.map(m => m.id));
    }
  };

  // ✅ NOUVEAU : Ouvrir la modale de suppression en lot
  const handleBulkDelete = () => {
    if (selectedMessages.length === 0) return;
    setShowBulkDeleteModal(true);
  };

  // ✅ NOUVEAU : Confirmer la suppression en lot
  const confirmBulkDelete = async () => {
    try {
      await Promise.all(
        selectedMessages.map(id => dataAdapter.messages.delete(id))
      );
      setShowBulkDeleteModal(false);
      setSelectedMessages([]);
      await loadData();
      alert(`${selectedMessages.length} message(s) supprimé(s) avec succès !`);
    } catch (error) {
      console.error('Error deleting messages:', error);
      alert('Erreur lors de la suppression des messages');
    }
  };

  const openEditModal = (msg: Message) => {
    setSelectedMessage(msg);
    setEditForm({
      subject: msg.subject,
      content: msg.content,
    });
    setShowEditModal(true);
  };

  if (loading) {
    return <div className="py-16 text-center"><p className="font-body text-gray-600">Chargement...</p></div>;
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            <h1 className="font-title text-4xl font-bold text-text">Messages</h1>
          </div>
          <button
            onClick={() => setShowComposeModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body font-semibold shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau message</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-title text-2xl font-bold text-text">Messages envoyés</h2>
            {messages.length > 0 && (
              <div className="flex items-center gap-4">
                {/* ✅ NOUVEAU : Bouton "Tout sélectionner" */}
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-body text-sm"
                >
                  {selectedMessages.length === messages.length ? (
                    <CheckSquare className="w-5 h-5 text-primary" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                  <span>
                    {selectedMessages.length === messages.length
                      ? 'Tout désélectionner'
                      : 'Tout sélectionner'}
                  </span>
                </button>

                {/* ✅ NOUVEAU : Bouton de suppression en lot */}
                {selectedMessages.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-body font-semibold shadow-md"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span>Supprimer ({selectedMessages.length})</span>
                  </button>
                )}
              </div>
            )}
          </div>
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="font-body text-gray-600">Aucun message envoyé</p>
              <p className="font-body text-sm text-gray-500 mt-2">Cliquez sur "Nouveau message" pour commencer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages
                .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
                .map(msg => {
                  const recipient = clients.find(c => c.id === msg.recipientId);
                  const isSelected = selectedMessages.includes(msg.id);
                  return (
                    <div
                      key={msg.id}
                      className={`border-2 rounded-lg p-5 hover:shadow-md transition group ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        {/* ✅ NOUVEAU : Checkbox de sélection */}
                        <div className="flex items-start space-x-3 flex-1">
                          <button
                            onClick={() => toggleMessageSelection(msg.id)}
                            className="mt-1 p-1 hover:bg-gray-100 rounded transition"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-primary" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-body text-sm text-gray-600">
                              {recipient ? `${recipient.firstName} ${recipient.lastName}` : 'Client inconnu'}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="font-body text-sm text-gray-500">
                              {new Date(msg.sentAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {msg.read && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-body font-semibold">
                                Lu
                              </span>
                            )}
                            {!msg.read && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-body font-semibold">
                                Non lu
                              </span>
                            )}
                            </div>
                            <h3 className="font-body text-lg font-semibold text-text mb-2">{msg.subject}</h3>
                            <p className="font-body text-gray-700 whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => openEditModal(msg)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition"
                            title="Modifier"
                          >
                            <Edit2 className="w-5 h-5 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(msg)}
                            className="p-2 hover:bg-red-50 rounded-lg transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* ✅ NOUVELLE MODALE : Confirmation de suppression */}
        {showDeleteModal && messageToDelete && (
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
                Supprimer ce message ?
              </h3>

              {/* Message */}
              <p className="font-body text-center text-gray-600 mb-6">
                Cette action est irréversible. Le message sera définitivement supprimé.
              </p>

              {/* Détails du message */}
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
                <p className="font-body text-sm text-gray-700 mb-2">
                  <strong>Destinataire :</strong> {clients.find(c => c.id === messageToDelete.recipientId)?.firstName} {clients.find(c => c.id === messageToDelete.recipientId)?.lastName}
                </p>
                <p className="font-body text-sm text-gray-700 mb-2">
                  <strong>Objet :</strong> {messageToDelete.subject}
                </p>
                <p className="font-body text-sm text-gray-700">
                  <strong>Aperçu :</strong> {messageToDelete.content.slice(0, 80)}{messageToDelete.content.length > 80 ? '...' : ''}
                </p>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setMessageToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-body font-semibold hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteMessage}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-body font-semibold hover:bg-red-700 transition shadow-md hover:shadow-lg"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ NOUVELLE MODALE : Confirmation de suppression en lot */}
        {showBulkDeleteModal && (
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
                Supprimer {selectedMessages.length} message(s) ?
              </h3>

              {/* Message */}
              <p className="font-body text-center text-gray-600 mb-6">
                Cette action est irréversible. Les messages sélectionnés seront définitivement supprimés.
              </p>

              {/* Liste des messages à supprimer */}
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
                <p className="font-body text-sm font-semibold text-gray-700 mb-3">
                  Messages à supprimer :
                </p>
                <div className="space-y-2">
                  {messages
                    .filter(m => selectedMessages.includes(m.id))
                    .map(msg => {
                      const recipient = clients.find(c => c.id === msg.recipientId);
                      return (
                        <div key={msg.id} className="bg-white rounded p-2 border border-red-200">
                          <p className="font-body text-xs text-gray-600">
                            <strong>{recipient?.firstName} {recipient?.lastName}</strong> - {msg.subject}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBulkDeleteModal(false);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-body font-semibold hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmBulkDelete}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-body font-semibold hover:bg-red-700 transition shadow-md hover:shadow-lg"
                >
                  Supprimer tout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Compose Modal */}
        {showComposeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Send className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-title text-3xl font-bold text-text">Nouveau message</h3>
                </div>
                <button 
                  onClick={() => setShowComposeModal(false)} 
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCompose} className="space-y-6">
                <div>
                  <label className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      checked={composeForm.selectAll}
                      onChange={(e) => setComposeForm({ ...composeForm, selectAll: e.target.checked, recipientId: '' })}
                      className="w-5 h-5 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <Users className="w-5 h-5 text-primary" />
                    <span className="font-body font-medium text-text">Envoyer à tous les clients</span>
                  </label>

                  {!composeForm.selectAll && (
                    <div>
                      <label className="block font-body text-sm font-medium text-text mb-2">
                        Destinataire *
                      </label>
                      <select
                        required
                        value={composeForm.recipientId}
                        onChange={(e) => setComposeForm({ ...composeForm, recipientId: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                      >
                        <option value="">Sélectionner un client</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>
                            {client.firstName} {client.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">
                    Objet *
                  </label>
                  <input
                    type="text"
                    required
                    value={composeForm.subject}
                    onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                    placeholder="Saisissez l'objet du message"
                  />
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={composeForm.content}
                    onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body resize-none"
                    placeholder="Rédigez votre message ici..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowComposeModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-body font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body font-semibold flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                    <span>Envoyer</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedMessage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Edit2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-title text-3xl font-bold text-text">Modifier le message</h3>
                </div>
                <button 
                  onClick={() => setShowEditModal(false)} 
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEdit} className="space-y-6">
                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">
                    Objet *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  />
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-text mb-2">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body resize-none"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-body font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body font-semibold shadow-md hover:shadow-lg"
                  >
                    Enregistrer
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