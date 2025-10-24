import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isMockMode } from '../lib/data';
import { createClient } from '@supabase/supabase-js';

const getSupabaseClient = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err) {
      setError('Email ou mot de passe incorrect. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);

    const supabase = getSupabaseClient();

    if (!supabase) {
      setResetError('Erreur de configuration');
      setResetLoading(false);
      return;
    }

    try {
      // ✅ Utilise l'URL de l'app depuis la variable d'environnement ou window.location
      const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${appUrl}/reset-password`,
      });

      if (error) throw error;

      setResetSuccess(true);
    } catch (err: any) {
      console.error('Error sending reset email:', err);
      setResetError(err.message || 'Erreur lors de l\'envoi de l\'email de réinitialisation');
    } finally {
      setResetLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md border p-8">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setResetSuccess(false);
                setResetError('');
                setResetEmail('');
              }}
              className="flex items-center text-gray-600 hover:text-gray-900 font-body text-sm mb-6 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la connexion
            </button>

            <div className="text-center mb-8">
              <h1 className="font-title text-3xl font-bold text-text mb-2">Mot de passe oublié ?</h1>
              <p className="font-body text-gray-600">
                {resetSuccess 
                  ? "Email envoyé !" 
                  : "Entrez votre email pour recevoir un lien de réinitialisation"
                }
              </p>
            </div>

            {resetSuccess ? (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg font-body text-sm">
                <p className="font-semibold mb-2">Email envoyé avec succès !</p>
                <p>Vérifiez votre boîte de réception et cliquez sur le lien pour réinitialiser votre mot de passe.</p>
                <p className="mt-2 text-xs text-green-600">N'oubliez pas de vérifier vos spams si vous ne voyez pas l'email.</p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label htmlFor="reset-email" className="block font-body text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="reset-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="font-body pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                {resetError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-body">
                    {resetError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-body font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetLoading ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block font-body text-sm font-medium text-gray-700 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="font-body pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block font-body text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="font-body text-sm text-primary hover:text-primary-dark transition"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-body pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-body">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-body font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-6 text-center font-body text-sm text-gray-600">
            Pas encore de compte ?{' '}
            <a href="/contact" className="text-primary hover:text-primary-dark font-medium">
              Contactez-nous
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
