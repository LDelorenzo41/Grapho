import { useState } from 'react';
import { Mail, Phone, MapPin, Calendar, Clock, Info } from 'lucide-react';
import { BookingCalendar } from '../components/BookingCalendar';
import { CALENDAR_COLORS } from '../lib/appointment';

export function Contact() {
  const [showBooking, setShowBooking] = useState(false);

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
                      <a href="mailto:contact@graphotherapie.fr" className="font-body text-text hover:text-primary transition">
                        contact@graphotherapie.fr
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
                        123 Avenue de la République<br />
                        75000 Paris
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vignette Horaires de consultation - MISE À JOUR */}
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

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="font-title text-2xl font-bold text-text mb-6">Formulaire de contact</h2>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block font-body text-sm font-medium text-text mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block font-body text-sm font-medium text-text mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body font-semibold"
                >
                  Envoyer le message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


