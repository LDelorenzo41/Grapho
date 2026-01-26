export function Privacy() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-title text-4xl font-bold text-text mb-8">Politique de confidentialité</h1>

        <div className="prose prose-lg font-body text-gray-700 space-y-6">
          <section>
            <h2 className="font-title text-2xl font-bold text-text mb-4">Introduction</h2>
            <p>
              La protection de vos données personnelles est une priorité pour le Cabinet de Graphothérapie. Cette politique
              de confidentialité vous informe sur la manière dont nous collectons, utilisons et protégeons vos données.
            </p>
          </section>

          <section>
            <h2 className="font-title text-2xl font-bold text-text mb-4">Données collectées</h2>
            <p>Nous collectons les données suivantes :</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Données d'identification (nom, prénom, date de naissance)</li>
              <li>Coordonnées (email, téléphone, adresse)</li>
              <li>Informations relatives aux rendez-vous et aux séances</li>
              <li>Documents et bilans graphiques</li>
            </ul>
          </section>

          <section>
            <h2 className="font-title text-2xl font-bold text-text mb-4">Utilisation des données</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul className="list-disc list-inside space-y-2">
              <li>La gestion de vos rendez-vous</li>
              <li>Le suivi de votre remédiation graphique</li>
              <li>La communication relative à vos séances</li>
              <li>L'établissement de factures et documents administratifs</li>
            </ul>
          </section>

          <section>
            <h2 className="font-title text-2xl font-bold text-text mb-4">Conservation des données</h2>
            <p>
              Vos données sont conservées pendant la durée de votre accompagnement, puis archivées conformément aux obligations
              légales (5 ans pour les documents administratifs et comptables).
            </p>
          </section>

          <section>
            <h2 className="font-title text-2xl font-bold text-text mb-4">Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement</li>
              <li>Droit à la portabilité de vos données</li>
              <li>Droit d'opposition au traitement</li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous par email à : philippine.cornet@gmail.com
            </p>
          </section>

          <section>
            <h2 className="font-title text-2xl font-bold text-text mb-4">Sécurité</h2>
            <p>
              Nous mettons en œuvre toutes les mesures techniques et organisationnelles appropriées pour protéger vos données
              contre tout accès, modification, divulgation ou destruction non autorisés.
            </p>
          </section>

          <section>
            <h2 className="font-title text-2xl font-bold text-text mb-4">Modifications</h2>
            <p>
              Cette politique de confidentialité peut être mise à jour. Nous vous informerons de toute modification importante
              par email ou via un avis sur notre site.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
