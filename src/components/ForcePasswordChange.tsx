import { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { dataAdapter } from '../lib/data';

const getSupabaseClient = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

interface ForcePasswordChangeProps {
  userId: string;
  userEmail: string;
  onPasswordChanged: () => void;
}

export function ForcePasswordChange({ userId, userEmail, onPasswordChanged }: ForcePasswordChangeProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword === 'Grapho2025') {
      setError('Vous ne pouvez pas utiliser le mot de passe provisoire. Choisissez un nouveau mot de passe.');
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('Erreur de configuration Supabase');
      }

      // 1. Mettre à jour le mot de passe dans auth
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) {
        console.error('Erreur updateUser:', authError);
        throw authError;
      }

      console.log('✅ Mot de passe mis à jour dans auth');

      // 2. Retirer le flag password_reset_required dans la table users
      await dataAdapter.users.update(userId, {
        passwordResetRequired: false
      });

      console.log('✅ Flag password_reset_required retiré');

      // 3. Callback de succès
      onPasswordChanged();
    } catch (err: any) {
      console.error('Erreur changement mot de passe:', err);
      setError(err.message || 'Erreur lors du changement de mot de passe');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
        {/* Icône d'alerte */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        {/* Titre */}
        <h2 className="font-title text-2xl font-bold text-text text-center mb-2">
          Changement de mot de passe requis
        </h2>
        <p className="font-body text-gray-600 text-center mb-6">
          Vous utilisez un mot de passe provisoire. Pour des raisons de sécurité, veuillez choisir un nouveau mot de passe.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="font-body text-sm text-blue-800">
            <strong>Compte :</strong> {userEmail}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block font-body text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="font-body pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <p className="font-body text-xs text-gray-500 mt-1">
              Minimum 6 caractères
            </p>
          </div>

          <div>
            <label htmlFor="confirm-password" className="block font-body text-sm font-medium text-gray-700 mb-2">
              Confirmer le mot de passe *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            className="w-full bg-primary hover:bg-primary-dark text-white font-body font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Changement en cours...' : 'Changer mon mot de passe'}
          </button>
        </form>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-6">
          <p className="font-body text-xs text-yellow-800">
            ⚠️ <strong>Note :</strong> Vous ne pourrez pas accéder à votre compte tant que vous n'aurez pas changé votre mot de passe.
          </p>
        </div>
      </div>
    </div>
  );
}