import { WifiOff } from 'lucide-react';

export function Offline() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4">
      <div className="text-center">
        <WifiOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h1 className="font-title text-3xl font-bold text-text mb-3">Vous êtes hors ligne</h1>
        <p className="font-body text-gray-600 mb-6">
          Veuillez vérifier votre connexion internet pour accéder à cette page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body font-semibold"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
