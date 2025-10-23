export function Method() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-title text-4xl md:text-5xl font-bold text-text mb-8">La méthode</h1>

        <div className="prose prose-lg font-body text-gray-700 space-y-6">
          <section>
            <h2 className="font-title text-2xl font-bold text-text mb-4">Qu'est-ce que la graphothérapie ?</h2>
            <p>
              La graphothérapie est une méthode de rééducation de l'écriture qui s'adresse aux enfants, adolescents et adultes
              rencontrant des difficultés graphiques : écriture lente, douloureuse, illisible ou fatigante.
            </p>
            <p>
              Elle vise à restaurer une écriture fluide, rapide et sans douleur grâce à des exercices progressifs et adaptés
              à chaque personne.
            </p>
          </section>

          <section>
            <h2 className="font-title text-2xl font-bold text-text mb-4">Pour qui ?</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Enfants en difficulté d'apprentissage de l'écriture</li>
              <li>Adolescents et étudiants avec une écriture lente ou douloureuse</li>
              <li>Adultes souhaitant améliorer leur écriture</li>
              <li>Personnes présentant des troubles dys (dysgraphie, dyspraxie)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-title text-2xl font-bold text-text mb-4">Le déroulement des séances</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-title text-xl font-semibold text-text mb-2">Première séance : le bilan</h3>
                <p>
                  Un bilan complet permet d'évaluer les difficultés graphiques, la posture, la tenue du crayon et la vitesse
                  d'écriture. Des objectifs personnalisés sont ensuite définis.
                </p>
              </div>
              <div>
                <h3 className="font-title text-xl font-semibold text-text mb-2">Séances de suivi</h3>
                <p>
                  Les séances hebdomadaires ou bimensuelles proposent des exercices variés : relaxation, motricité fine,
                  graphisme et écriture. Des exercices à la maison complètent le travail en séance.
                </p>
              </div>
              <div>
                <h3 className="font-title text-xl font-semibold text-text mb-2">Durée de l'accompagnement</h3>
                <p>
                  En moyenne, 15 à 20 séances suffisent pour observer des progrès significatifs. La durée varie selon
                  l'âge, les difficultés et l'assiduité aux exercices.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
