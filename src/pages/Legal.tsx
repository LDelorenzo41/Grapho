export function Legal() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-title text-4xl font-bold text-text mb-8">Mentions légales</h1>

        <div className="prose prose-lg font-body text-gray-700 space-y-6">
          <section>
            <h2 className="font-title text-2xl font-bold text-text mb-4">Éditeur du site</h2>
            <p>
              <strong>Cabinet de Graphothérapie</strong><br />
              Sophie Martin<br />
              123 Avenue de la République<br />
              75000 Paris<br />
              Email : contact@graphotherapie.fr<br />
              Téléphone : 06 12 34 56 78
            </p>
          </section>

          <section>
            <h2 className="font-title text-2xl font-bold text-text mb-4">Hébergement</h2>
            <p>
              Ce site est hébergé par Netlify, Inc.<br />
              2325 3rd Street, Suite 296<br />
              San Francisco, California 94107<br />
              États-Unis
            </p>
          </section>

          <section>
            <h2 className="font-title text-2xl font-bold text-text mb-4">Propriété intellectuelle</h2>
            <p>
              L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété
              intellectuelle. Tous les droits de reproduction sont réservés.
            </p>
          </section>

          <section>
            <h2 className="font-title text-2xl font-bold text-text mb-4">Protection des données personnelles</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de
              rectification et de suppression des données vous concernant.
            </p>
            <p>
              Pour exercer ces droits, vous pouvez nous contacter par email à l'adresse : contact@graphotherapie.fr
            </p>
          </section>

          <section>
            <h2 className="font-title text-2xl font-bold text-text mb-4">Cookies</h2>
            <p>
              Ce site utilise uniquement des cookies techniques nécessaires au bon fonctionnement de l'application.
              Aucun cookie publicitaire ou de pistage n'est utilisé.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
