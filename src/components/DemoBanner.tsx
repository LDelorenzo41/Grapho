import { isMockMode } from '../lib/data';
import { AlertCircle } from 'lucide-react';

export function DemoBanner() {
  if (!isMockMode) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex items-center">
        <AlertCircle className="w-5 h-5 text-yellow-400 mr-3" />
        <p className="font-body text-sm text-yellow-700">
          <strong>Mode démo (données locales)</strong> - Les données sont stockées uniquement dans votre navigateur.
        </p>
      </div>
    </div>
  );
}
