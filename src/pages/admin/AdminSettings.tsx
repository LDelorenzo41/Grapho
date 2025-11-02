import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, Plus, Trash2, Edit2, X, ArrowLeft, Lock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { dataAdapter, type Settings, type AvailabilityRule } from '../../lib/data';
import { DemoBanner } from '../../components/DemoBanner';

// Client Supabase pour le changement de mot de passe
const getSupabaseClient = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

export function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRule, setEditingRule] = useState<AvailabilityRule | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '12:00',
  });

  // États pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // ✅ NOUVEAU : État pour la modale de confirmation de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<AvailabilityRule | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les settings
        const s = await dataAdapter.settings.get();
        if (!s.availabilityRules) {
          s.availabilityRules = [];
        }
        setSettings(s);
        
        // ✅ Charger les availability_rules depuis la table dédiée
        const rules = await dataAdapter.availabilityRules.getAll();
        setAvailabilityRules(rules);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await dataAdapter.settings.update(settings);
      alert('Paramètres enregistrés avec succès');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validations
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    setChangingPassword(true);
    const supabase = getSupabaseClient();

    if (!supabase) {
      setPasswordError('Erreur de configuration');
      setChangingPassword(false);
      return;
    }

    try {
      // Méthode Supabase pour changer le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordSuccess('Mot de passe modifié avec succès !');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      setPasswordError(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      const rule = availabilityRules.find(r => r.id === ruleId);
      if (!rule) return;
      
      const updatedRule = { ...rule, isActive: !rule.isActive };
      await dataAdapter.availabilityRules.update(ruleId, updatedRule);
      
      setAvailabilityRules(availabilityRules.map(r =>
        r.id === ruleId ? updatedRule : r
      ));
    } catch (error) {
      console.error('Error toggling rule:', error);
      alert('Erreur lors de la modification');
    }
  };

  // ✅ NOUVELLE VERSION : Ouvrir la modale de confirmation au lieu de confirm()
  const handleDeleteRule = (rule: AvailabilityRule) => {
    setRuleToDelete(rule);
    setShowDeleteModal(true);
  };

  // ✅ NOUVEAU : Confirmer la suppression
  const confirmDeleteRule = async () => {
    if (!ruleToDelete) return;
    
    try {
      await dataAdapter.availabilityRules.delete(ruleToDelete.id);
      setAvailabilityRules(availabilityRules.filter(rule => rule.id !== ruleToDelete.id));
      setShowDeleteModal(false);
      setRuleToDelete(null);
      alert('Disponibilité supprimée avec succès !');
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const handleAddRule = async () => {
    try {
      const rule: Omit<AvailabilityRule, 'id'> = {
        dayOfWeek: newRule.dayOfWeek,
        startTime: newRule.startTime,
        endTime: newRule.endTime,
        isActive: true,
      };
      
      const createdRule = await dataAdapter.availabilityRules.create(rule);
      setAvailabilityRules([...availabilityRules, createdRule]);
      setShowAddRule(false);
      setNewRule({ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' });
    } catch (error) {
      console.error('Error adding rule:', error);
      alert('Erreur lors de l\'ajout');
    }
  };

  const handleEditRule = async (rule: AvailabilityRule) => {
    try {
      await dataAdapter.availabilityRules.update(rule.id, rule);
      setAvailabilityRules(availabilityRules.map(r =>
        r.id === rule.id ? rule : r
      ));
      setEditingRule(null);
    } catch (error) {
      console.error('Error editing rule:', error);
      alert('Erreur lors de la modification');
    }
  };

  if (loading || !settings) {
    return <div className="py-16 text-center"><p className="font-body text-gray-600">Chargement...</p></div>;
  }

  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <DemoBanner />
        <div className="flex items-center space-x-4 mb-8">
          <Link
            to="/admin/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-title text-4xl font-bold text-text">Paramètres</h1>
        </div>

        <div className="space-y-6">
          {/* SECTION: Sécurité */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Lock className="w-6 h-6 text-primary" />
              <h2 className="font-title text-2xl font-bold text-text">Sécurité</h2>
            </div>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block font-body text-sm font-medium text-text mb-2">
                  Nouveau mot de passe *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  placeholder="Minimum 6 caractères"
                />
              </div>

              <div>
                <label className="block font-body text-sm font-medium text-text mb-2">
                  Confirmer le nouveau mot de passe *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body"
                  placeholder="Confirmer le mot de passe"
                />
              </div>

              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 font-body">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600 font-body">{passwordSuccess}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={changingPassword}
                className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{changingPassword ? 'Modification...' : 'Changer le mot de passe'}</span>
              </button>
            </form>
          </div>

          {/* Section Disponibilités */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-title text-2xl font-bold text-text">Disponibilités pour les premiers rendez-vous</h2>
              <button
                onClick={() => setShowAddRule(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter</span>
              </button>
            </div>
            <div className="space-y-2">
              {availabilityRules.map(rule => {
                const isEditing = editingRule?.id === rule.id;

                if (isEditing) {
                  return (
                    <div key={rule.id} className="flex items-center space-x-2 py-3 border-b">
                      <select
                        value={editingRule.dayOfWeek}
                        onChange={e => setEditingRule({ ...editingRule, dayOfWeek: parseInt(e.target.value) })}
                        className="px-2 py-1 border rounded font-body text-sm"
                      >
                        {days.map((day, idx) => (
                          <option key={idx} value={idx}>{day}</option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={editingRule.startTime}
                        onChange={e => setEditingRule({ ...editingRule, startTime: e.target.value })}
                        className="px-2 py-1 border rounded font-body text-sm"
                      />
                      <span className="font-body text-gray-600">-</span>
                      <input
                        type="time"
                        value={editingRule.endTime}
                        onChange={e => setEditingRule({ ...editingRule, endTime: e.target.value })}
                        className="px-2 py-1 border rounded font-body text-sm"
                      />
                      <button
                        onClick={() => handleEditRule(editingRule)}
                        className="px-3 py-1 bg-primary text-white rounded text-sm font-body"
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => setEditingRule(null)}
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div key={rule.id} className="flex items-center justify-between py-3 border-b">
                    <div className="font-body text-text">
                      <span className="font-semibold">{days[rule.dayOfWeek]}</span>
                      <span className="mx-2 text-gray-600">-</span>
                      <span>{rule.startTime} - {rule.endTime}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {rule.isActive ? 'Actif' : 'Inactif'}
                      </button>
                      <button
                        onClick={() => setEditingRule(rule)}
                        className="p-1.5 hover:bg-gray-100 rounded"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule)}
                        className="p-1.5 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {availabilityRules.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 font-body">Aucune disponibilité configurée</p>
                  <p className="text-sm text-gray-400 font-body mt-1">Cliquez sur "Ajouter" pour créer votre première disponibilité</p>
                </div>
              )}
            </div>

            {showAddRule && (
              <div className="mt-4 p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                <h3 className="font-body font-semibold text-text mb-3">Nouvelle disponibilité</h3>
                <div className="flex items-center space-x-3 mb-3">
                  <select
                    value={newRule.dayOfWeek}
                    onChange={e => setNewRule({ ...newRule, dayOfWeek: parseInt(e.target.value) })}
                    className="px-3 py-2 border rounded-lg font-body"
                  >
                    {days.map((day, idx) => (
                      <option key={idx} value={idx}>{day}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={newRule.startTime}
                    onChange={e => setNewRule({ ...newRule, startTime: e.target.value })}
                    className="px-3 py-2 border rounded-lg font-body"
                  />
                  <span className="font-body text-gray-600">-</span>
                  <input
                    type="time"
                    value={newRule.endTime}
                    onChange={e => setNewRule({ ...newRule, endTime: e.target.value })}
                    className="px-3 py-2 border rounded-lg font-body"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddRule}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body"
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => {
                      setShowAddRule(false);
                      setNewRule({ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-body"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section Templates emails */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="font-title text-2xl font-bold text-text mb-4">Modèles d'emails</h2>
            <div className="space-y-4">
              <div>
                <label className="block font-body text-sm font-medium text-text mb-2">
                  Confirmation de rendez-vous
                </label>
                <textarea
                  value={settings.emailTemplates.appointmentConfirmation}
                  onChange={e => setSettings({
                    ...settings,
                    emailTemplates: { ...settings.emailTemplates, appointmentConfirmation: e.target.value }
                  })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body text-sm"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-text mb-2">
                  Rappel de rendez-vous
                </label>
                <textarea
                  value={settings.emailTemplates.appointmentReminder}
                  onChange={e => setSettings({
                    ...settings,
                    emailTemplates: { ...settings.emailTemplates, appointmentReminder: e.target.value }
                  })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-body text-sm"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer les paramètres emails'}</span>
          </button>
        </div>

        {/* ✅ NOUVELLE MODALE : Confirmation de suppression */}
        {showDeleteModal && ruleToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
              {/* Icône d'alerte */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-12 h-12 text-red-600" />
                </div>
              </div>

              {/* Titre */}
              <h3 className="font-title text-2xl font-bold text-text text-center mb-2">
                Supprimer cette disponibilité ?
              </h3>

              {/* Message */}
              <p className="font-body text-center text-gray-600 mb-6">
                Cette action est irréversible. Cette plage horaire sera définitivement supprimée.
              </p>

              {/* Détails de la règle */}
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
                <p className="font-body text-sm text-gray-700 mb-2">
                  <strong>Jour :</strong> {days[ruleToDelete.dayOfWeek]}
                </p>
                <p className="font-body text-sm text-gray-700">
                  <strong>Horaire :</strong> {ruleToDelete.startTime} - {ruleToDelete.endTime}
                </p>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setRuleToDelete(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-body font-semibold hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDeleteRule}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-body font-semibold hover:bg-red-700 transition shadow-md hover:shadow-lg"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
