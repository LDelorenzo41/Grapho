import { Link } from 'react-router-dom';
import { Calendar, FileText, Mail, Info } from 'lucide-react';
import { useState } from 'react';
import { BioModal } from '../components/BioModal';

export function Home() {
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);

  return (
    <div>
      <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="font-title text-5xl md:text-6xl font-bold text-text mb-6">
              Retrouvez le plaisir d'écrire

            </h1>
            <p className="font-body text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
              Un accompagnement personnalisé en graphothérapie pour les enfants et adultes qui souhaitent améliorer leur écriture et retrouver le plaisir d'écrire, avec confort et confiance
            </p>
            <Link
              to="/contact"
              className="inline-block px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body text-lg font-semibold shadow-lg"
            >
              Prendre rendez-vous
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1 p-8 md:p-12">
                <h2 className="font-title text-3xl font-bold text-text mb-6">
                  Philippine Cornet
                  <span className="block text-xl text-primary mt-2">Graphothérapeute diplômée</span>
                </h2>
                <div className="font-body text-gray-700 space-y-4 leading-relaxed">
                  <p>
                    Philippine Cornet, graphothérapeute diplômée, met son sens de l'écoute et son expérience d'enseignante au service de ceux qui souhaitent retrouver le plaisir d'écrire.
                  </p>
                  <p>
                    Ancienne professeure d'éducation musicale, elle allie rigueur, douceur et pédagogie pour accompagner chaque enfant — ou adulte — à développer une écriture fluide, lisible et apaisée.
                  </p>
                  <p>
                    Son approche, à la fois bienveillante et structurée, repose sur la confiance, la progression et la valorisation des réussites.
                  </p>
                </div>
                
                {/* Bouton En savoir plus */}
                <div className="mt-6">
                  <button
                    onClick={() => setIsBioModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition font-body font-semibold"
                  >
                    <Info className="w-5 h-5" />
                    En savoir plus sur mon parcours
                  </button>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <img
                  src="/image1.JPG"
                  alt="Philippine Cornet, graphothérapeute"
                  className="w-full h-full object-cover"
                  style={{ minHeight: '400px', maxHeight: '600px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-title text-3xl font-bold text-text text-center mb-12">
            Comment ça fonctionne ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-title text-xl font-bold text-text mb-3">1. Prise de rendez-vous</h3>
              <p className="font-body text-gray-600">
                Contactez-nous pour fixer un premier rendez-vous adapté à vos disponibilités.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-title text-xl font-bold text-text mb-3">2. Bilan initial</h3>
              <p className="font-body text-gray-600">
                Évaluation complète de l'écriture et définition d'objectifs personnalisés.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-title text-xl font-bold text-text mb-3">3. Suivi régulier</h3>
              <p className="font-body text-gray-600">
                Séances hebdomadaires avec exercices adaptés et suivi des progrès.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-title text-3xl font-bold text-text mb-6">
            Pourquoi consulter un graphothérapeute ?
          </h2>
          <div className="font-body text-lg text-gray-700 space-y-4">
            <p>
              La graphothérapie s'adresse aux enfants, adolescents et adultes qui rencontrent des difficultés d'écriture :
              lenteur, douleurs, illisibilité, fatigue...
            </p>
            <p>
              Grâce à des exercices personnalisés et ludiques, la graphothérapie permet de retrouver une écriture fluide et confortable.
            </p>
          </div>
          <Link
            to="/methode"
            className="inline-block mt-8 px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition font-body font-semibold"
          >
            En savoir plus sur la méthode
          </Link>
        </div>
      </section>

      {/* Modal Bio */}
      <BioModal isOpen={isBioModalOpen} onClose={() => setIsBioModalOpen(false)} />
    </div>
  );
}
