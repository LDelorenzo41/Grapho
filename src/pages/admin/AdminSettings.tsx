import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, Plus, Trash2, Edit2, X, ArrowLeft } from 'lucide-react';
import { dataAdapter, type Settings, type AvailabilityRule } from '../../lib/data';
import { DemoBanner } from '../../components/DemoBanner';

export function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRule, setEditingRule] = useState<AvailabilityRule | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '12:00',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const s = await dataAdapter.settings.get();
        setSettings(s);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
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

  const handleToggleRule = (ruleId: string) => {
    if (!settings) return;
    const updatedRules = settings.availabilityRules.map(rule =>
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    );
    setSettings({ ...settings, availabilityRules: updatedRules });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (!settings) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) return;
    const updatedRules = settings.availabilityRules.filter(rule => rule.id !== ruleId);
    setSettings({ ...settings, availabilityRules: updatedRules });
  };

  const handleAddRule = () => {
    if (!settings) return;
    const rule: AvailabilityRule = {
      id: `rule-${Date.now()}`,
      dayOfWeek: newRule.dayOfWeek,
      startTime: newRule.startTime,
      endTime: newRule.endTime,
      isActive: true,
    };
    setSettings({ ...settings, availabilityRules: [...settings.availabilityRules, rule] });
    setShowAddRule(false);
    setNewRule({ dayOfWeek: 1, startTime: '09:00', endTime: '12:00' });
  };

  const handleEditRule = (rule: AvailabilityRule) => {
    if (!settings) return;
    const updatedRules = settings.availabilityRules.map(r =>
      r.id === rule.id ? rule : r
    );
    setSettings({ ...settings, availabilityRules: updatedRules });
    setEditingRule(null);
  };

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
              {settings.availabilityRules.map(rule => {
                const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
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
                        className="px-3 py-1 bg-primary text-white rounded hover:bg-primary/90 font-body text-sm"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setEditingRule(null)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div key={rule.id} className="flex items-center justify-between py-3 border-b">
                    <span className="font-body text-text font-semibold w-32">{days[rule.dayOfWeek]}</span>
                    <span className="font-body text-gray-600 flex-1">
                      {rule.startTime} - {rule.endTime}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleRule(rule.id)}
                        className={`px-3 py-1 rounded text-xs font-semibold ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
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
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
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
                    {['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map((day, idx) => (
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
            <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
