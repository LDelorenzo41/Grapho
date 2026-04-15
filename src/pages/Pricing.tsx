import { Check, Sparkles } from 'lucide-react';

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
          {/* Parcours principal : 1 → 4 */}
          <div className="mb-10">
            <h2 className="font-title text-2xl md:text-3xl font-bold text-text mb-2 text-center">
              Le parcours d'accompagnement
            </h2>
            <p className="font-body text-gray-600 text-center mb-8">
              Les quatre étapes clés du bilan et de la remédiation
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Premier rendez-vous */}
              <div className="relative bg-white rounded-lg shadow-md border-2 border-gray-200 p-8">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary text-white font-title text-xl font-bold flex items-center justify-center shadow-md">
                  1
                </div>
                <h3 className="font-title text-xl font-bold text-text mb-4">Premier rendez-vous</h3>
                <div className="mb-5">
                  <span className="font-title text-3xl font-bold text-primary">30€</span>
                  <span className="font-body text-gray-600 ml-2">/ 30 min</span>
                </div>
                <ul className="space-y-3 font-body text-gray-700">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Première rencontre pour faire connaissance, identifier votre besoin (problématique, bilan, accompagnement ponctuel …) et débuter l'anamnèse.</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>30 minutes</span>
                  </li>
                </ul>
              </div>

              {/* 2. Passation des tests */}
              <div className="relative bg-white rounded-lg shadow-md border-2 border-gray-200 p-8">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary text-white font-title text-xl font-bold flex items-center justify-center shadow-md">
                  2
                </div>
                <h3 className="font-title text-xl font-bold text-text mb-4">Passation des tests</h3>
                <div className="mb-5">
                  <span className="font-title text-3xl font-bold text-primary">60 à 90€</span>
                  <span className="font-body text-gray-600 ml-2">/ séance</span>
                </div>
                <ul className="space-y-3 font-body text-gray-700">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>À définir ensemble lors du premier rendez-vous, selon l'âge et le profil du scripteur.</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>1 à 2 heures</span>
                  </li>
                </ul>
              </div>

              {/* 3. Restitution du bilan */}
              <div className="relative bg-white rounded-lg shadow-md border-2 border-gray-200 p-8 md:col-span-2">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary text-white font-title text-xl font-bold flex items-center justify-center shadow-md">
                  3
                </div>
                <h3 className="font-title text-xl font-bold text-text mb-2">Restitution du bilan</h3>
                <p className="font-body text-gray-700 mb-5">
                  Rendez-vous d'1 heure pour la restitution et l'exposition du plan de remédiation.
                  Deux options sont proposées pour le bilan :
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-200 p-5 bg-gray-50">
                    <div className="flex items-baseline justify-between mb-3">
                      <h4 className="font-title text-lg font-semibold text-text">Format « synthèse »</h4>
                      <span className="font-title text-2xl font-bold text-primary">45€</span>
                    </div>
                    <ul className="space-y-2 font-body text-sm text-gray-700">
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        <span>Reprend seulement les résultats des tests et leur interprétation sous forme de tableaux et cartes mentales.</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        <span>Permet de garder une trace de l'écriture avant séances de remédiation pour mesurer les progrès et de donner un axe de travail précis en fonction des résultats.</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        <span>Non-utilisable dans un cadre administratif.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-lg border-2 border-primary p-5 bg-primary/5">
                    <div className="flex items-baseline justify-between mb-3">
                      <h4 className="font-title text-lg font-semibold text-text">Format rédigé</h4>
                      <span className="font-title text-2xl font-bold text-primary">70€</span>
                    </div>
                    <ul className="space-y-2 font-body text-sm text-gray-700">
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        <span>Document d'environ 15 pages.</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        <span>Nécessaire pour toute demande d'aménagement pédagogique, MDPH, ou toute démarche administrative.</span>
                      </li>
                      <li className="flex items-start">
                        <Check className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        <span>Important dans le cadre d'une prise en charge plurielle.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 4. Séances de remédiation */}
              <div className="relative bg-white rounded-lg shadow-md border-2 border-primary p-8 md:col-span-2">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary text-white font-title text-xl font-bold flex items-center justify-center shadow-md">
                  4
                </div>
                <div className="inline-block px-3 py-1 bg-primary text-white text-sm rounded-full mb-4 font-body">
                  Recommandé
                </div>
                <h3 className="font-title text-xl font-bold text-text mb-4">Séances de remédiation</h3>
                <div className="mb-5">
                  <span className="font-title text-3xl font-bold text-primary">50€</span>
                  <span className="font-body text-gray-600 ml-2">/ séance</span>
                </div>
                <ul className="space-y-3 font-body text-gray-700">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>1 heure</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Offres complémentaires : 5 & 6 - Couleur accent (rose poudré) */}
          <div className="mt-16">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-6 h-6" style={{ color: '#C68664' }} />
              <h2 className="font-title text-2xl md:text-3xl font-bold text-text text-center">
                Offres complémentaires
              </h2>
            </div>
            <p className="font-body text-gray-600 text-center mb-8">
              Découverte et ateliers, ouverts à toutes et tous
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 5. Séance découverte */}
              <div className="bg-[#E5B7A4]/15 rounded-lg shadow-md border-2 border-[#E5B7A4] p-8">
                <h3 className="font-title text-xl font-bold text-text mb-4">Séance découverte</h3>
                <div className="mb-5">
                  <span className="font-title text-3xl font-bold" style={{ color: '#C68664' }}>30€</span>
                  <span className="font-body text-gray-600 ml-2">/ séance</span>
                </div>
                <ul className="space-y-3 font-body text-gray-700">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: '#C68664' }} />
                    <span>Une séance pour découvrir ce qu'est la graphothérapie, pour tous les âges : tracés-glissés, détente du geste, tenue du crayon, rythme … Nous commençons l'heure par un échange autour de votre écriture, votre lien avec elle, pour que je puisse ensuite adapter la séance à vos envies.</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: '#C68664' }} />
                    <span>Limité à une séance par personne</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: '#C68664' }} />
                    <span>1h</span>
                  </li>
                </ul>
              </div>

              {/* 6. Ateliers */}
              <div className="bg-[#E5B7A4]/15 rounded-lg shadow-md border-2 border-[#E5B7A4] p-8">
                <h3 className="font-title text-xl font-bold text-text mb-4">Ateliers</h3>
                <div className="mb-5">
                  <span className="font-title text-3xl font-bold" style={{ color: '#C68664' }}>15 à 40€</span>
                  <span className="font-body text-gray-600 ml-2">/ atelier</span>
                </div>
                <ul className="space-y-3 font-body text-gray-700">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: '#C68664' }} />
                    <span>Regroupements par tranches d'âge et problématiques pour aborder un sujet de manière ponctuelle, douce et ludique. L'objectif des ateliers : dédramatiser et s'amuser !</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: '#C68664' }} />
                    <span>Plannings affichés sur les réseaux et en salle d'attente.</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: '#C68664' }} />
                    <span>Limités à 3 enfants / adolescents par atelier.</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" style={{ color: '#C68664' }} />
                    <span>1h à 2h</span>
                  </li>
                </ul>
              </div>
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

