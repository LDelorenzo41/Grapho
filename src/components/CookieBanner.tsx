import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'graphotherapie_cookie_consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <p className="font-body text-sm text-gray-700 flex-1">
            Ce site utilise des cookies essentiels pour son fonctionnement. Aucun cookie publicitaire ou de pistage n'est utilisé.
          </p>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleAccept}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition font-body text-sm whitespace-nowrap"
            >
              J'accepte
            </button>
            <button
              onClick={handleAccept}
              className="p-2 text-gray-500 hover:text-gray-700 transition"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
