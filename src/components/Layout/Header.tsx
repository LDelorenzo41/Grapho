import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-title text-2xl font-bold text-primary">Cabinet de Graphothérapie</span>
          </Link>

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

          <div className="flex items-center space-x-4">
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
        </div>
      </div>
    </header>
  );
}
