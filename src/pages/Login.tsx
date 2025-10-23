import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isMockMode } from '../lib/data';

export function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login(email);
      if (loggedInUser?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err) {
      setError('Email non reconnu. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md border p-8">
          <div className="text-center mb-8">
            <h1 className="font-title text-3xl font-bold text-text mb-2">Connexion</h1>
            <p className="font-body text-gray-600">Accédez à votre espace personnel</p>
          </div>

          {isMockMode && (
            <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
                <div className="font-body text-sm text-blue-700">
                  <p className="font-semibold mb-1">Mode démo actif</p>
                  <p className="mb-2">Utilisez un de ces emails pour vous connecter :</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>admin@graphotherapie.fr (admin)</li>
                    <li>marie.dupont@example.com (client)</li>
                    <li>lucas.bernard@example.com (client)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {!isMockMode && (
            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="font-body text-sm text-gray-700">
                Un lien magique sera envoyé à votre adresse email pour vous connecter en toute sécurité.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block font-body text-sm font-medium text-text mb-2">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  placeholder="votre.email@example.com"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-body text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!isMockMode)}
              className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : isMockMode ? 'Se connecter' : 'Envoyer le lien magique'}
            </button>

            {!isMockMode && (
              <p className="text-center font-body text-xs text-gray-500 mt-3">
                Cette fonctionnalité sera disponible lors de l'activation de Supabase
              </p>
            )}
          </form>
        </div>

        <p className="text-center font-body text-sm text-gray-600 mt-6">
          Pas encore de compte ?{' '}
          <a href="/contact" className="text-primary hover:underline">
            Contactez-nous
          </a>
        </p>
      </div>
    </div>
  );
}
