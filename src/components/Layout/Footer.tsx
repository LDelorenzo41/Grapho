import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-title text-lg font-bold text-text mb-4">Cabinet de Graphothérapie</h3>
            <p className="font-body text-sm text-gray-600">
              Accompagnement personnalisé pour améliorer l'écriture et retrouver le plaisir d'écrire.
            </p>
          </div>

          <div>
            <h4 className="font-title text-sm font-bold text-text mb-3">Navigation</h4>
            <ul className="space-y-2 font-body text-sm">
              <li>
                <Link to="/methode" className="text-gray-600 hover:text-primary transition">
                  La méthode
                </Link>
              </li>
              <li>
                <Link to="/tarifs" className="text-gray-600 hover:text-primary transition">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-600 hover:text-primary transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-primary transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-title text-sm font-bold text-text mb-3">Informations légales</h4>
            <ul className="space-y-2 font-body text-sm">
              <li>
                <Link to="/mentions-legales" className="text-gray-600 hover:text-primary transition">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link to="/politique-confidentialite" className="text-gray-600 hover:text-primary transition">
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 text-center">
          <p className="font-body text-sm text-gray-600">
            © {new Date().getFullYear()} Cabinet de Graphothérapie. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
