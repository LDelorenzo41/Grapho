import { Check } from 'lucide-react';

export function Pricing() {
  return (
    <div>
      {/* Section titre - FOND BLANC */}
      <section className="bg-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-title text-4xl md:text-5xl font-bold text-text mb-4 text-center">Tarifs</h1>
          <p className="font-body text-lg text-gray-600 text-center">
            Des tarifs transparents pour un accompagnement de qualité
          </p>
        </div>
      </section>

      {/* Section cartes tarifs - FOND COLORÉ */}
      <section className="bg-[#E5B7A4]/20 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-8">
              <h2 className="font-title text-2xl font-bold text-text mb-4">Bilan initial</h2>
              <div className="mb-6">
                <span className="font-title text-4xl font-bold text-primary">80€</span>
                <span className="font-body text-gray-600 ml-2">/ séance</span>
              </div>
              <ul className="space-y-3 font-body text-gray-700">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Évaluation complète de l'écriture (90 min)</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Analyse de la posture et de la tenue du crayon</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Compte-rendu écrit détaillé</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Définition des objectifs personnalisés</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-md border-2 border-primary p-8">
              <div className="inline-block px-3 py-1 bg-primary text-white text-sm rounded-full mb-4 font-body">
                Recommandé
              </div>
              <h2 className="font-title text-2xl font-bold text-text mb-4">Séance de suivi</h2>
              <div className="mb-6">
                <span className="font-title text-4xl font-bold text-primary">50€</span>
                <span className="font-body text-gray-600 ml-2">/ séance</span>
              </div>
              <ul className="space-y-3 font-body text-gray-700">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Séance individuelle de 45 minutes</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Exercices personnalisés et progressifs</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Suivi régulier des progrès</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <span>Exercices à faire à la maison</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section infos pratiques - FOND BLANC */}
      <section className="bg-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#E5B7A4]/10 rounded-lg p-8">
            <h2 className="font-title text-2xl font-bold text-text mb-4">Informations pratiques</h2>
            <div className="space-y-4 font-body text-gray-700">
              <div>
                <h3 className="font-semibold text-text mb-1">Paiement</h3>
                <p>Le règlement s'effectue à la fin de chaque séance par chèque ou espèces.</p>
              </div>
              <div>
                <h3 className="font-semibold text-text mb-1">Remboursement</h3>
                <p>
                  La graphothérapie n'est pas remboursée par la Sécurité sociale. Certaines mutuelles proposent des prises en charge
                  partielles au titre des médecines douces. N'hésitez pas à vous renseigner.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-text mb-1">Annulation</h3>
                <p>
                  Toute séance non annulée 48h à l'avance est due.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

