import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit2, X, ArrowLeft, Lock, Clock, Sun, Umbrella } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { dataAdapter, type Settings, type AvailabilityRule, type ScheduleType } from '../../lib/data';
import { DemoBanner } from '../../components/DemoBanner';

// Client Supabase pour le changement de mot de passe
const getSupabaseClient = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const WORKING_DAYS = [3, 4, 6]; // Mercredi, Jeudi, Samedi

export function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<AvailabilityRule | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [activeScheduleType, setActiveScheduleType] = useState<ScheduleType>('normal');
  const [newRule, setNewRule] = useState({
    dayOfWeek: 3,
    startTime: '09:00',
    endTime: '12:00',
    scheduleType: 'normal' as ScheduleType,
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

  // État pour la modale de confirmation de suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<AvailabilityRule | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const s = await dataAdapter.settings.get();
        if (!s.availabilityRules) {
          s.availabilityRules = [];
        }
        setSettings(s);
        
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

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

  const handleDeleteRule = (rule: AvailabilityRule) => {
    setRuleToDelete(rule);
    setShowDeleteModal(true);
  };

  const confirmDeleteRule = async () => {
    if (!ruleToDelete) return;
    
    try {
      await dataAdapter.availabilityRules.delete(ruleToDelete.id);
      setAvailabilityRules(availabilityRules.filter(rule => rule.id !== ruleToDelete.id));
      setShowDeleteModal(false);
      setRuleToDelete(null);
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
        scheduleType: activeScheduleType,
      };
      
      const createdRule = await dataAdapter.availabilityRules.create(rule);
      setAvailabilityRules([...availabilityRules, createdRule]);
      setShowAddRule(false);
      setNewRule({ dayOfWeek: 3, startTime: '09:00', endTime: '12:00', scheduleType: activeScheduleType });
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

  // Filtrer les règles par type
  const normalRules = availabilityRules.filter(r => r.scheduleType === 'normal');
  const exceptionalRules = availabilityRules.filter(r => r.scheduleType === 'exceptional');
  const currentRules = activeScheduleType === 'normal' ? normalRules : exceptionalRules;

  // Grouper les règles par jour
  const rulesByDay = currentRules.reduce((acc, rule) => {
    if (!acc[rule.dayOfWeek]) {
      acc[rule.dayOfWeek] = [];
    }
    acc[rule.dayOfWeek].push(rule);
    return acc;
  }, {} as Record<number, AvailabilityRule[]>);

  if (loading || !settings) {
    return <div className="py-16 text-center"><p className="font-body text-gray-600">Chargement...</p></div>;
  }

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

          {/* SECTION: Disponibilités */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Clock className="w-6 h-6 text-primary" />
              <h2 className="font-title text-2xl font-bold text-text">Horaires de consultation</h2>
            </div>

            {/* Onglets Normal / Vacances */}
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setActiveScheduleType('normal')}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-body font-medium transition ${
                  activeScheduleType === 'normal'
                    ? 'bg-[#8FA382] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Sun className="w-5 h-5" />
                <span>Hors vacances</span>
              </button>
              <button
                onClick={() => setActiveScheduleType('exceptional')}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-body font-medium transition ${
                  activeScheduleType === 'exceptional'
                    ? 'bg-[#E5B7A4] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Umbrella className="w-5 h-5" />
                <span>Vacances scolaires</span>
              </button>
            </div>

            {/* Description */}
            <div className={`p-4 rounded-lg mb-6 ${
              activeScheduleType === 'normal' 
                ? 'bg-[#8FA382]/10 border border-[#8FA382]/30' 
                : 'bg-[#E5B7A4]/20 border border-[#E5B7A4]/30'
            }`}>
              <p className="font-body text-sm text-gray-700">
                {activeScheduleType === 'normal' 
                  ? 'Ces horaires s\'appliquent en période scolaire normale (hors vacances et jours fériés).'
                  : 'Ces horaires s\'appliquent pendant les vacances scolaires (Zone B) et les jours fériés.'
                }
              </p>
            </div>

            {/* Liste des jours travaillés */}
            <div className="space-y-4">
              {WORKING_DAYS.map(dayIndex => {
                const dayRules = rulesByDay[dayIndex] || [];
                
                return (
                  <div key={dayIndex} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-body font-semibold text-text text-lg">
                        {DAYS[dayIndex]}
                      </h3>
                      <button
                        onClick={() => {
                          setNewRule({ ...newRule, dayOfWeek: dayIndex, scheduleType: activeScheduleType });
                          setShowAddRule(true);
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition font-body"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Ajouter</span>
                      </button>
                    </div>

                    {dayRules.length === 0 ? (
                      <p className="text-gray-400 font-body text-sm italic">Fermé ce jour</p>
                    ) : (
                      <div className="space-y-2">
                        {dayRules.map(rule => {
                          const isEditing = editingRule?.id === rule.id;

                          if (isEditing) {
                            return (
                              <div key={rule.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
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
                                  OK
                                </button>
                                <button
                                  onClick={() => setEditingRule(null)}
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <X className="w-4 h-4 text-gray-600" />
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div key={rule.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <span className={`font-body ${rule.isActive ? 'text-text' : 'text-gray-400 line-through'}`}>
                                  {rule.startTime} - {rule.endTime}
                                </span>
                                {!rule.isActive && (
                                  <span className="text-xs text-gray-400 font-body">(désactivé)</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleToggleRule(rule.id)}
                                  className={`px-2 py-1 rounded text-xs font-semibold transition ${
                                    rule.isActive 
                                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                  }`}
                                >
                                  {rule.isActive ? 'ON' : 'OFF'}
                                </button>
                                <button
                                  onClick={() => setEditingRule(rule)}
                                  className="p-1.5 hover:bg-gray-200 rounded"
                                >
                                  <Edit2 className="w-4 h-4 text-gray-500" />
                                </button>
                                <button
                                  onClick={() => handleDeleteRule(rule)}
                                  className="p-1.5 hover:bg-red-100 rounded"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modale Ajouter */}
            {showAddRule && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
                  <h3 className="font-title text-xl font-bold text-text mb-4">
                    Ajouter un créneau - {DAYS[newRule.dayOfWeek]}
                  </h3>
                  <p className="font-body text-sm text-gray-500 mb-4">
                    {activeScheduleType === 'normal' ? 'Horaires hors vacances' : 'Horaires vacances scolaires'}
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block font-body text-sm font-medium text-text mb-2">Jour</label>
                      <select
                        value={newRule.dayOfWeek}
                        onChange={e => setNewRule({ ...newRule, dayOfWeek: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg font-body"
                      >
                        {WORKING_DAYS.map(dayIdx => (
                          <option key={dayIdx} value={dayIdx}>{DAYS[dayIdx]}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-body text-sm font-medium text-text mb-2">Début</label>
                        <input
                          type="time"
                          value={newRule.startTime}
                          onChange={e => setNewRule({ ...newRule, startTime: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg font-body"
                        />
                      </div>
                      <div>
                        <label className="block font-body text-sm font-medium text-text mb-2">Fin</label>
                        <input
                          type="time"
                          value={newRule.endTime}
                          onChange={e => setNewRule({ ...newRule, endTime: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg font-body"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setShowAddRule(false);
                        setNewRule({ dayOfWeek: 3, startTime: '09:00', endTime: '12:00', scheduleType: activeScheduleType });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-body"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleAddRule}
                      className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modale de confirmation de suppression */}
        {showDeleteModal && ruleToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
            <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-12 h-12 text-red-600" />
                </div>
              </div>

              <h3 className="font-title text-2xl font-bold text-text text-center mb-2">
                Supprimer ce créneau ?
              </h3>

              <p className="font-body text-center text-gray-600 mb-6">
                Cette action est irréversible.
              </p>

              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
                <p className="font-body text-sm text-gray-700 mb-1">
                  <strong>Jour :</strong> {DAYS[ruleToDelete.dayOfWeek]}
                </p>
                <p className="font-body text-sm text-gray-700 mb-1">
                  <strong>Horaire :</strong> {ruleToDelete.startTime} - {ruleToDelete.endTime}
                </p>
                <p className="font-body text-sm text-gray-700">
                  <strong>Type :</strong> {ruleToDelete.scheduleType === 'normal' ? 'Hors vacances' : 'Vacances scolaires'}
                </p>
              </div>

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


