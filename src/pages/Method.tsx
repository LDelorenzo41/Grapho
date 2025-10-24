export function Method() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-title text-4xl md:text-5xl font-bold text-text mb-8">La méthode</h1>

        <div className="prose prose-lg font-body text-gray-700 space-y-6">
          <section>
            <h2 className="font-title text-2xl font-bold text-text mb-4">🖋️ Qu'est-ce que la graphothérapie ?</h2>
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
            <h2 className="font-title text-2xl font-bold text-text mb-4">💬 Pour qui ?</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>🌼 Enfants en difficulté d'apprentissage de l'écriture. Lorsqu'écrire devient une épreuve, que les lettres s'emmêlent ou que la main se fatigue trop vite.</li>
              <li>🌼 Adolescents et étudiants avec une écriture lente ou douloureuse. Quand l'écriture perd en lisibilité, que le rythme scolaire s'accélère ou que la confiance s'effrite.</li>
              <li>🌼 Adultes souhaitant améliorer leur écriture. Retrouver le confort du geste, améliorer la lisibilité, ou simplement renouer avec le plaisir d'écrire à la main.</li>
              <li>Personnes présentant des troubles dys (dysgraphie, dyspraxie, TDA/H…) en complément d'un suivi pluridisciplinaire.
</li>
            </ul>
          </section>

          <section>
            <h2 className="font-title text-2xl font-bold text-text mb-4">🧭 Comment se déroule une prise en charge ?</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-title text-xl font-semibold text-text mb-3">1. Le bilan de l'écriture manuscrite</h3>
                <p className="mb-3">
                  Le bilan se compose de 3 rendez-vous distincts :
                </p>
                <ul className="space-y-3 ml-4">
                  <li className="flex items-start">
                    <span className="text-primary mr-3 mt-1">•</span>
                    <span>Le premier nous permet de nous rencontrer (graphothérapeute + enfant + parents) et d'éclaircir toutes les inquiétudes ;</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-3 mt-1">•</span>
                    <span>Le deuxième rendez-vous se déroule avec l'enfant seul. Il permet d'évaluer le geste graphique, la posture, la tenue du crayon et la motricité fine au travers de tests. Ce bilan sert à comprendre les origines des difficultés et à définir un plan de rééducation personnalisé ; il sera utilisable par la suite auprès de personnels de santé suivant le scripteur, ainsi qu'auprès de la MDPH dans le cadre d'une demande de dossier ;</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-3 mt-1">•</span>
                    <span>Le troisième rendez-vous constitutif du bilan est un rendez-vous de remise du bilan aux parents et à l'enfant, afin de discuter ensemble d'un plan de remédiation et d'un suivi adapté aux besoins de chacun.</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-title text-xl font-semibold text-text mb-2">2. Les séances de rééducation</h3>
                <p>
                  Les séances de rééducation sont ensuite construites comme des moments de détente et de progression : on bouge, on respire, on trace, on joue avec les formes et les mouvements. Petit à petit, l'écriture devient plus fluide, plus souple… et souvent, plus joyeuse aussi.
                </p>
              </div>
              
              <div>
                <h3 className="font-title text-xl font-semibold text-text mb-2">3. Le suivi et l'accompagnement</h3>
                <p>
                  Chaque progression est valorisée, et des conseils pratiques sont donnés pour favoriser l'autonomie et la confiance dans le quotidien, afin de permettre des résultats dans la durée.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
