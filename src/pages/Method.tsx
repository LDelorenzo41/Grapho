import { Baby, GraduationCap, Briefcase, HeartHandshake, FileText, Users, TrendingUp } from 'lucide-react';

export function Method() {
  return (
    <div>
      {/* Titre principal */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-title text-4xl md:text-5xl font-bold text-text mb-0 text-center">La méthode</h1>
        </div>
      </div>

      {/* Section 1: Qu'est-ce que la graphothérapie - FOND COLORÉ */}
      <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-title text-3xl font-bold text-text mb-6 text-center">🖋️ Qu'est-ce que la graphothérapie ?</h2>
            <div className="bg-white rounded-2xl p-8 shadow-md">
              <div className="font-body text-lg text-gray-700 space-y-4 text-center">
                <p>
                  La graphothérapie est une méthode de rééducation de l'écriture qui s'adresse aux enfants, adolescents et adultes
                  rencontrant des difficultés graphiques : écriture lente, douloureuse, illisible ou fatigante.
                </p>
                <p>
                  Elle vise à restaurer une écriture fluide, rapide et sans douleur grâce à des exercices progressifs et adaptés
                  à chaque personne.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Pour qui ? - FOND BLANC */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-title text-3xl font-bold text-text mb-10 text-center">💬 Pour qui ?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Carte 1: Enfants */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-500 text-white p-4 rounded-full">
                  <Baby className="w-8 h-8" />
                </div>
              </div>
              <h3 className="font-title text-xl font-bold text-text mb-3 text-center">Enfants</h3>
              <p className="font-body text-gray-700 text-center">
                En difficulté d'apprentissage de l'écriture. Lorsqu'écrire devient une épreuve, que les lettres s'emmêlent ou que la main se fatigue trop vite.
              </p>
            </div>

            {/* Carte 2: Adolescents */}
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="bg-green-500 text-white p-4 rounded-full">
                  <GraduationCap className="w-8 h-8" />
                </div>
              </div>
              <h3 className="font-title text-xl font-bold text-text mb-3 text-center">Adolescents & Étudiants</h3>
              <p className="font-body text-gray-700 text-center">
                Avec une écriture lente ou douloureuse. Quand l'écriture perd en lisibilité, que le rythme scolaire s'accélère ou que la confiance s'effrite.
              </p>
            </div>

            {/* Carte 3: Adultes */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="bg-purple-500 text-white p-4 rounded-full">
                  <Briefcase className="w-8 h-8" />
                </div>
              </div>
              <h3 className="font-title text-xl font-bold text-text mb-3 text-center">Adultes</h3>
              <p className="font-body text-gray-700 text-center">
                Souhaitant améliorer leur écriture. Retrouver le confort du geste, améliorer la lisibilité, ou simplement renouer avec le plaisir d'écrire à la main.
              </p>
            </div>

            {/* Carte 4: Troubles dys */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="bg-pink-500 text-white p-4 rounded-full">
                  <HeartHandshake className="w-8 h-8" />
                </div>
              </div>
              <h3 className="font-title text-xl font-bold text-text mb-3 text-center">Troubles dys</h3>
              <p className="font-body text-gray-700 text-center">
                Personnes présentant des troubles dys (dysgraphie, dyspraxie, TDA/H…) en complément d'un suivi pluridisciplinaire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Comment se déroule une prise en charge - FOND GRIS CLAIR */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-title text-3xl font-bold text-text mb-10 text-center">🧭 Comment se déroule une prise en charge ?</h2>
          
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Carte 1: Le bilan */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Numéro et icône à gauche */}
                <div className="md:col-span-2 bg-gradient-to-br from-primary to-primary/80 flex flex-col items-center justify-center p-6">
                  <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mb-3">
                    <span className="font-title text-3xl font-bold text-primary">1</span>
                  </div>
                  <FileText className="w-10 h-10 text-white" />
                </div>
                
                {/* Contenu à droite */}
                <div className="md:col-span-10 p-6">
                  <h3 className="font-title text-2xl font-bold text-text mb-4">Le bilan de l'écriture manuscrite</h3>
                  <p className="font-body text-gray-700 mb-4">
                    Le bilan se compose de <strong>3 rendez-vous distincts</strong> :
                  </p>
                  <ul className="space-y-3 font-body text-gray-700">
                    <li className="flex items-start">
                      <span className="text-primary mr-3 mt-1 font-bold">•</span>
                      <span>Le <strong>premier</strong> nous permet de nous rencontrer (graphothérapeute + enfant + parents) et d'éclaircir toutes les inquiétudes ;</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-3 mt-1 font-bold">•</span>
                      <span>Le <strong>deuxième rendez-vous</strong> se déroule avec l'enfant seul. Il permet d'évaluer le geste graphique, la posture, la tenue du crayon et la motricité fine au travers de tests. Ce bilan sert à comprendre les origines des difficultés et à définir un plan de rééducation personnalisé ;</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-3 mt-1 font-bold">•</span>
                      <span>Le <strong>troisième rendez-vous</strong> est un rendez-vous de remise du bilan aux parents et à l'enfant, afin de discuter ensemble d'un plan de remédiation et d'un suivi adapté aux besoins de chacun.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Carte 2: Les séances */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Numéro et icône à gauche */}
                <div className="md:col-span-2 bg-gradient-to-br from-secondary to-secondary/80 flex flex-col items-center justify-center p-6">
                  <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mb-3">
                    <span className="font-title text-3xl font-bold text-secondary">2</span>
                  </div>
                  <Users className="w-10 h-10 text-white" />
                </div>
                
                {/* Contenu à droite */}
                <div className="md:col-span-10 p-6">
                  <h3 className="font-title text-2xl font-bold text-text mb-4">Les séances de rééducation</h3>
                  <p className="font-body text-gray-700">
                    Les séances de rééducation sont ensuite construites comme des moments de <strong>détente et de progression</strong> : on bouge, on respire, on trace, on joue avec les formes et les mouvements. Petit à petit, l'écriture devient plus fluide, plus souple… et souvent, plus joyeuse aussi.
                  </p>
                </div>
              </div>
            </div>

            {/* Carte 3: Le suivi */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Numéro et icône à gauche */}
                <div className="md:col-span-2 bg-gradient-to-br from-green-500 to-green-600 flex flex-col items-center justify-center p-6">
                  <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mb-3">
                    <span className="font-title text-3xl font-bold text-green-500">3</span>
                  </div>
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                
                {/* Contenu à droite */}
                <div className="md:col-span-10 p-6">
                  <h3 className="font-title text-2xl font-bold text-text mb-4">Le suivi et l'accompagnement</h3>
                  <p className="font-body text-gray-700">
                    Chaque progression est <strong>valorisée</strong>, et des conseils pratiques sont donnés pour favoriser l'autonomie et la confiance dans le quotidien, afin de permettre des résultats dans la durée.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}