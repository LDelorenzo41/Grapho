import { X } from 'lucide-react';
import { useState } from 'react';
import './BioModal.css';

interface BioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BioModal({ isOpen, onClose }: BioModalProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'approach' | 'background' | 'philosophy'>('about');

  if (!isOpen) return null;

  const tabs = [
    { id: 'about', label: 'À propos', mobileLabel: '🌿', fullLabel: '🌿 À propos' },
    { id: 'approach', label: 'Mon approche', mobileLabel: '🖋️', fullLabel: '🖋️ Mon approche' },
    { id: 'background', label: 'Mon parcours', mobileLabel: '🎓', fullLabel: '🎓 Mon parcours' },
    { id: 'philosophy', label: 'Ma philosophie', mobileLabel: '🌼', fullLabel: '🌼 Ma philosophie' },
  ] as const;

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-3 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <img 
              src="/image1.JPG" 
              alt="Philippine Cornet"
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-title text-lg sm:text-2xl font-bold text-text truncate">Philippine Cornet</h2>
              <p className="text-primary font-body text-sm sm:text-base">Graphothérapeute certifiée</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition flex-shrink-0 ml-2"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-2 sm:px-6">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2 sm:py-3 font-body font-semibold whitespace-nowrap transition border-b-2 text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="sm:hidden">{tab.mobileLabel}</span>
                <span className="hidden sm:inline">{tab.fullLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="font-body text-gray-700 leading-relaxed text-sm sm:text-base">
            {activeTab === 'about' && (
              <div className="space-y-4">
                <h3 className="font-title text-xl sm:text-2xl font-bold text-text mb-4">
                  Redonner à chacun le plaisir d'écrire, avec confort et confiance
                </h3>
                <p>
                  Je suis Philippine Cornet, graphothérapeute, spécialiste de la remédiation de l'écriture manuscrite, 
                  passionnée par le geste d'écriture et tout ce qu'il raconte de nous. Derrière chaque écriture, il y a 
                  une histoire, une émotion, une manière singulière d'être au monde. C'est cette richesse que je cherche 
                  à accueillir et à accompagner, pour la révéler.
                </p>
              </div>
            )}

            {activeTab === 'approach' && (
              <div className="space-y-4 sm:space-y-6">
                <p>
                  La graphothérapie s'appuie sur des connaissances en motricité fine, ergonomie et geste graphique. Elle permet d'agir à la fois sur les aspects techniques (tenue du crayon, posture) et sur les 
                  dimensions émotionnelles liées à l'acte d'écrire. J'accorde une grande importance au lien de confiance et 
                  à la progression en douceur, car c'est dans la sécurité et la bienveillance que les changements s'installent 
                  durablement.
                </p>
                
                <div>
                  <h4 className="font-title text-lg sm:text-xl font-bold text-text mb-3">
                    Mon accompagnement repose sur trois piliers :
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex gap-2 sm:gap-3">
                      <span className="text-primary font-bold flex-shrink-0">•</span>
                      <span>
                        <strong>L'observation précise du geste graphique,</strong> grâce à un bilan complet et rigoureux
                      </span>
                    </li>
                    <li className="flex gap-2 sm:gap-3">
                      <span className="text-primary font-bold flex-shrink-0">•</span>
                      <span>
                        <strong>La remédiation personnalisée,</strong> adaptée à l'âge, au profil et aux besoins de chacun
                      </span>
                    </li>
                    <li className="flex gap-2 sm:gap-3">
                      <span className="text-primary font-bold flex-shrink-0">•</span>
                      <span>
                        <strong>L'écoute et la bienveillance,</strong> indispensables à la progression et à la confiance retrouvée
                      </span>
                    </li>
                  </ul>
                </div>

                <p>
                  En séance, nous explorons ensemble le mouvement, la posture, la respiration, le rythme du geste. 
                  Petit à petit, les tensions s'apaisent, la main se délie, et l'écriture retrouve sa fluidité naturelle.
                </p>
              </div>
            )}

            {activeTab === 'background' && (
              <div className="space-y-4">
                <p>
                  Après un parcours de professeure de musique en collège, j'ai choisi de me former à la graphothérapie 
                  auprès de Nisaba Formation afin d'aider les enfants, adolescents et adultes à renouer avec leur écriture.
                </p>
                <p>
                  Mon parcours initial d'enseignante m'a permis de me rendre compte du besoin des élèves de renouer 
                  avec une écriture libre, tant pour se faire comprendre que pour se faire confiance eux-mêmes. J'ai à coeur de 
                  développer une approche globale du geste d'écriture, à la croisée du physique et du mental.
                </p>
                <p>
                  Je tiens à travailler en lien avec les enseignants, psychologues, orthophonistes, ergothérapeutes, 
                  psychomotriciens, médecins, afin de proposer un accompagnement cohérent en réelle synergie avec tous les 
                  professionnels du soin et de l'éducation qui accompagnent les enfants. Cette prise en charge globale est 
                  un élément central de mon approche.
                </p>
              </div>
            )}

            {activeTab === 'philosophy' && (
              <div className="space-y-4">
                <p>
                  Chaque écriture est unique, et chaque difficulté a une cause différente. Mon objectif n'est pas de 
                  "changer" une écriture ou de trouver "une bonne" manière d'écrire, mais d'aider la personne à retrouver 
                  une écriture lisible, fluide et confortable, adaptée à son propre fonctionnement. Il s'agit de trouver 
                  son écriture.
                </p>
                <p>
                  Je veille à instaurer un cadre rassurant, structuré et respectueux du rythme de chacun. L'évolution se 
                  fait progressivement, à travers des exercices concrets, variés et toujours porteurs de sens.
                </p>
                <p className="font-semibold text-primary">
                  Je suis convaincue que chaque progrès est une victoire, et qu'il n'y a pas de petite victoire !
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}