import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-title text-xl sm:text-2xl font-bold text-primary">
              Cabinet de Graphothérapie
            </span>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/methode" className="font-body text-text hover:text-primary transition">
              La méthode
            </Link>
            <Link to="/tarifs" className="font-body text-text hover:text-primary transition">
              Tarifs
            </Link>
            <Link to="/faq" className="font-body text-text hover:text-primary transition">
              FAQ
            </Link>
            <Link to="/contact" className="font-body text-text hover:text-primary transition">
              Contact
            </Link>
          </nav>

          {/* Boutons utilisateur Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to={user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-body"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{user.firstName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 font-body"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </button>
              </>
            ) : (
              <Link
                to="/connexion"
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body"
              >
                Se connecter
              </Link>
            )}
          </div>

          {/* Bouton Menu Mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-4 space-y-3">
            <Link
              to="/methode"
              onClick={closeMenu}
              className="block font-body text-text hover:text-primary transition py-2"
            >
              La méthode
            </Link>
            <Link
              to="/tarifs"
              onClick={closeMenu}
              className="block font-body text-text hover:text-primary transition py-2"
            >
              Tarifs
            </Link>
            <Link
              to="/faq"
              onClick={closeMenu}
              className="block font-body text-text hover:text-primary transition py-2"
            >
              FAQ
            </Link>
            <Link
              to="/contact"
              onClick={closeMenu}
              className="block font-body text-text hover:text-primary transition py-2"
            >
              Contact
            </Link>

            <div className="border-t border-gray-200 pt-3 mt-3 space-y-3">
              {user ? (
                <>
                  <Link
                    to={user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard'}
                    onClick={closeMenu}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-body"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>{user.firstName}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-gray-900 font-body w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/connexion"
                  onClick={closeMenu}
                  className="block text-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body"
                >
                  Se connecter
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
