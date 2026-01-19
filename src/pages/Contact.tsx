import { useState } from 'react';
import { Mail, Phone, MapPin, Calendar, Clock, Info, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { BookingCalendar } from '../components/BookingCalendar';
import { CALENDAR_COLORS } from '../lib/appointment';
import { sendContactFormMessage } from '../lib/email';

export function Contact() {
  const [showBooking, setShowBooking] = useState(false);
  
  // États du formulaire de contact
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formError, setFormError] = useState('');

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');
    setFormError('');

    try {
      const success = await sendContactFormMessage({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        message: formData.message,
      });

      if (success) {
        setFormStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setFormStatus('error');
        setFormError('Une erreur est survenue lors de l\'envoi. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur envoi formulaire:', error);
      setFormStatus('error');
      setFormError('Une erreur est survenue. Veuillez réessayer ou nous contacter par téléphone.');
    }
  };

  const resetForm = () => {
    setFormStatus('idle');
    setFormError('');
  };

  return (
    <div>
      {/* Section titre - FOND BLANC */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-title text-4xl md:text-5xl font-bold text-text mb-4 text-center">Contact</h1>
          <p className="font-body text-lg text-gray-600 text-center">
            N'hésitez pas à me contacter pour toute question ou prise de rendez-vous
          </p>
        </div>
      </section>

      {/* Section CTA et calendrier - FOND COLORÉ */}
      <section className="bg-[#E5B7A4]/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl shadow-lg p-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="font-title text-3xl font-bold text-white mb-2">
                  Prenez votre premier rendez-vous
                </h2>
                <p className="font-body text-white/90 text-lg">
                  Premier RDV (30 min) ou Séance de remédiation (1h)
                </p>
              </div>
              <button
                onClick={() => setShowBooking(!showBooking)}
                className="flex items-center space-x-2 px-6 py-3 bg-white text-primary rounded-lg hover:bg-gray-50 transition font-body font-semibold shadow-md"
              >
                <Calendar className="w-5 h-5" />
                <span>{showBooking ? 'Masquer le calendrier' : 'Voir les disponibilités'}</span>
              </button>
            </div>
          </div>

          {showBooking && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mt-8">
              <BookingCalendar onBookingComplete={() => setShowBooking(false)} />
            </div>
          )}
        </div>
      </section>

      {/* Section contact et formulaire - FOND BLANC */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="font-title text-2xl font-bold text-text mb-6">Informations de contact</h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-body text-sm text-gray-600">Email</p>
                      <a href="mailto:philippine.cornet@gmail.com" className="font-body text-text hover:text-primary transition">
                        philippine.cornet@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-body text-sm text-gray-600">Téléphone</p>
                      <a href="tel:0612345678" className="font-body text-text hover:text-primary transition">
                        06 12 34 56 78
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-body text-sm text-gray-600">Adresse</p>
                      <p className="font-body text-text">
  Pôle Val d’Amboise<br />
  274 rue du Château d’Eau<br />
  Ilot n°4 – Zone de la Boitardière<br />
  37530 Chargé<br />
  <span className="text-sm text-gray-600">
    Accès PMR, parking gratuit sur place, salle d’attente.
  </span>
</p>

                    </div>
                  </div>
                </div>
              </div>

              {/* Vignette Horaires de consultation */}
              <div 
                className="rounded-lg p-6"
                style={{ backgroundColor: `${CALENDAR_COLORS.available}15` }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5" style={{ color: CALENDAR_COLORS.available }} />
                  <h3 className="font-title text-lg font-bold text-text">Horaires de consultation</h3>
                </div>
                
                {/* Horaires normaux */}
                <div className="space-y-2 font-body text-gray-700 mb-4">
                  <div className="flex justify-between">
                    <span>Lundi</span>
                    <span className="text-gray-400">Fermé</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mardi</span>
                    <span className="text-gray-400">Fermé</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="font-semibold" style={{ color: CALENDAR_COLORS.available }}>Mercredi</span>
                    <span className="text-right">9h30 - 12h30, 13h00 - 16h00</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="font-semibold" style={{ color: CALENDAR_COLORS.available }}>Jeudi</span>
                    <span className="text-right">9h30 - 12h30, 13h00 - 15h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vendredi</span>
                    <span className="text-gray-400">Fermé</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="font-semibold" style={{ color: CALENDAR_COLORS.available }}>Samedi</span>
                    <span className="text-right">10h00 - 13h00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dimanche</span>
                    <span className="text-gray-400">Fermé</span>
                  </div>
                </div>

                {/* Note vacances scolaires */}
                <div 
                  className="mt-4 p-3 rounded-lg flex items-start gap-3"
                  style={{ backgroundColor: `${CALENDAR_COLORS.accent}30` }}
                >
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: CALENDAR_COLORS.unavailable }} />
                  <div className="font-body text-sm text-gray-700">
                    <p className="font-semibold mb-1">Vacances scolaires & jours fériés</p>
                    <p>Horaires étendus les mercredis, jeudis et samedis :</p>
                    <p className="mt-1">9h30 - 12h30, 13h30 - 18h30</p>
                  </div>
                </div>

                {/* Types de RDV */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="font-body text-sm font-semibold text-text mb-2">Types de rendez-vous :</p>
                  <div className="space-y-1 font-body text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: CALENDAR_COLORS.available }}
                      />
                      <span>Premier rendez-vous : 30 minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: CALENDAR_COLORS.available }}
                      />
                      <span>Séance de remédiation : 1 heure</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: CALENDAR_COLORS.accent }}
                      />
                      <span>Bilan : sur rendez-vous au cabinet</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulaire de contact */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="font-title text-2xl font-bold text-text mb-6">Formulaire de contact</h2>
              
              {/* Message de succès */}
              {formStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-body font-semibold text-green-800 mb-1">
                        Message envoyé avec succès !
                      </h3>
                      <p className="font-body text-sm text-green-700">
                        Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.
                        Un email de confirmation vous a été envoyé.
                      </p>
                      <button
                        onClick={resetForm}
                        className="mt-3 text-sm font-body font-medium text-green-700 hover:text-green-800 underline"
                      >
                        Envoyer un autre message
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Message d'erreur */}
              {formStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-body font-semibold text-red-800 mb-1">
                        Erreur lors de l'envoi
                      </h3>
                      <p className="font-body text-sm text-red-700">
                        {formError}
                      </p>
                      <button
                        onClick={resetForm}
                        className="mt-3 text-sm font-body font-medium text-red-700 hover:text-red-800 underline"
                      >
                        Réessayer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulaire */}
              {formStatus !== 'success' && (
                <form onSubmit={handleSubmitContact} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block font-body text-sm font-medium text-text mb-2">
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={formStatus === 'sending'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block font-body text-sm font-medium text-text mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={formStatus === 'sending'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block font-body text-sm font-medium text-text mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={formStatus === 'sending'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block font-body text-sm font-medium text-text mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      disabled={formStatus === 'sending'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body disabled:bg-gray-100 disabled:cursor-not-allowed"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={formStatus === 'sending'}
                    className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {formStatus === 'sending' ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Envoyer le message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}



