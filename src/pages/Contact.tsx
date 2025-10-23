import { useState } from 'react';
import { Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { BookingCalendar } from '../components/BookingCalendar';

export function Contact() {
  const [showBooking, setShowBooking] = useState(false);

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-title text-4xl md:text-5xl font-bold text-text mb-4 text-center">Contact</h1>
        <p className="font-body text-lg text-gray-600 text-center mb-12">
          N'hésitez pas à me contacter pour toute question ou prise de rendez-vous
        </p>

        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl shadow-lg p-8 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="font-title text-3xl font-bold text-white mb-2">
                Prenez votre premier rendez-vous
              </h2>
              <p className="font-body text-white/90 text-lg">
                Consultation d'une heure - Choisissez votre créneau
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
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-12">
            <BookingCalendar onBookingComplete={() => setShowBooking(false)} />
          </div>
        )}

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

            <div className="bg-primary/5 rounded-lg p-6">
              <h3 className="font-title text-lg font-bold text-text mb-3">Horaires de consultation</h3>
              <div className="space-y-2 font-body text-gray-700">
                <div className="flex justify-between">
                  <span>Lundi</span>
                  <span className="text-right">9h00 - 12h00, 14h00 - 18h00</span>
                </div>
                <div className="flex justify-between">
                  <span>Mardi</span>
                  <span className="text-gray-500">Fermé</span>
                </div>
                <div className="flex justify-between">
                  <span>Mercredi</span>
                  <span className="text-right">9h00 - 12h00, 14h00 - 18h00</span>
                </div>
                <div className="flex justify-between">
                  <span>Jeudi</span>
                  <span className="text-gray-500">Fermé</span>
                </div>
                <div className="flex justify-between">
                  <span>Vendredi</span>
                  <span className="text-right">9h00 - 12h00</span>
                </div>
                <div className="flex justify-between">
                  <span>Samedi - Dimanche</span>
                  <span className="text-gray-500">Fermé</span>
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
    </div>
  );
}
