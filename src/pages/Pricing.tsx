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
<div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
  <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 p-8">
    <h2 className="font-title text-2xl font-bold text-text mb-4">Bilan initial</h2>
    <div className="mb-6">
      <span className="font-title text-4xl font-bold text-primary">170€</span>
      <span className="font-body text-gray-600 ml-2">/ bilan</span>
    </div>
    <ul className="space-y-3 font-body text-gray-700">
      <li className="flex items-start">
        <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
        <span>Premier rendez-vous d’environ 30 minutes pour échanger autour de la problématique</span>
      </li>
      <li className="flex items-start">
        <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
        <span>Rendez-vous de 2h dédié à la passation des tests</span>
      </li>
      <li className="flex items-start">
        <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
        <span>Troisième rendez-vous d’une heure pour présenter les résultats du bilan</span>
      </li>
      <li className="flex items-start">
        <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
        <span>Proposition d’un accompagnement personnalisé et adapté</span>
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
      <span>Séance individuelle de 50 minutes</span>
    </li>
    <li className="flex items-start">
      <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
      <span>10 minutes d’échange avec le parent en fin de séance</span>
    </li>
    <li className="flex items-start">
      <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
      <span>Retour sur le déroulement de la séance et les progrès observés</span>
    </li>
    <li className="flex items-start">
      <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
      <span>Identification des points de vigilance et conseils personnalisés</span>
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
                  Les séances ne sont pas remboursées par la Sécurité sociale ; cependant, certaines mutuelles
peuvent prendre en charge en partie ou en totalité le coût des séances (Maaf, Malakoff, MGEN, MGC,
Novalis, Swiss Life…). Il est possible de bénéficier d’un remboursement des séances dans le cadre
d’un dossier MDPH, selon votre situation.
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

