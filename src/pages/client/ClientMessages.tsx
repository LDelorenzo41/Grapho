import { useEffect, useState } from 'react';
import { MessageSquare, Mail, MailOpen, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { dataAdapter, type Message } from '../../lib/data';

export function ClientMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    if (!user) return;
    try {
      const allMessages = await dataAdapter.messages.getByUserId(user.id);
      // Filter messages where user is recipient
      setMessages(allMessages.filter(m => m.recipientId === user.id));
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const openMessage = async (msg: Message) => {
    setSelectedMessage(msg);
    setShowMessageModal(true);
    
    // Mark as read if not already
    if (!msg.read) {
      try {
        await dataAdapter.messages.markAsRead(msg.id);
        await loadMessages();
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const unreadCount = messages.filter(m => !m.read).length;

  if (loading) {
    return <div className="py-16 text-center"><p className="font-body text-gray-600">Chargement...</p></div>;
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-8 h-8 text-primary" />
            <div>
              <h1 className="font-title text-4xl font-bold text-text">Mes Messages</h1>
              {unreadCount > 0 && (
                <p className="font-body text-sm text-gray-600 mt-1">
                  {unreadCount} message{unreadCount > 1 ? 's' : ''} non lu{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="font-body text-gray-600">Aucun message reçu</p>
              <p className="font-body text-sm text-gray-500 mt-2">Vos messages apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages
                .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
                .map(msg => (
                  <div
                    key={msg.id}
                    onClick={() => openMessage(msg)}
                    className={`
                      border rounded-lg p-5 cursor-pointer transition
                      ${msg.read 
                        ? 'border-gray-200 hover:shadow-md bg-white' 
                        : 'border-primary bg-primary/5 hover:shadow-md hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`p-3 rounded-full ${msg.read ? 'bg-gray-100' : 'bg-primary/20'}`}>
                          {msg.read ? (
                            <MailOpen className="w-5 h-5 text-gray-600" />
                          ) : (
                            <Mail className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className={`font-body text-lg ${msg.read ? 'font-medium' : 'font-bold'} text-text`}>
                              {msg.subject}
                            </h3>
                            {!msg.read && (
                              <span className="px-2 py-1 bg-primary text-white text-xs rounded-full font-body font-semibold">
                                Nouveau
                              </span>
                            )}
                          </div>
                          <p className="font-body text-gray-600 line-clamp-2 mb-2">{msg.content}</p>
                          <p className="font-body text-sm text-gray-500">
                            {new Date(msg.sentAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Message Detail Modal */}
        {showMessageModal && selectedMessage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <MessageSquare className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-title text-3xl font-bold text-text mb-3">
                      {selectedMessage.subject}
                    </h3>
                    <p className="font-body text-sm text-gray-500">
                      Reçu le {new Date(selectedMessage.sentAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMessageModal(false)} 
                  className="p-2 hover:bg-gray-100 rounded-full transition ml-4"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="prose max-w-none">
                  <p className="font-body text-gray-700 whitespace-pre-wrap text-lg leading-relaxed">
                    {selectedMessage.content}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body font-semibold shadow-md hover:shadow-lg"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}