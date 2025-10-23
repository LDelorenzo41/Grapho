import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { dataAdapter, type User } from '../lib/data';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'graphotherapie_auth_user_id';

// Créer le client Supabase
const getSupabaseClient = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('Supabase credentials not configured');
    return null;
  }

  return createClient(url, key);
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    const loadUser = async () => {
      const userId = localStorage.getItem(AUTH_STORAGE_KEY);
      if (userId) {
        try {
          const foundUser = await dataAdapter.users.getById(userId);
          if (foundUser) {
            setUser(foundUser);
          } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        } catch (error) {
          console.error('Error loading user:', error);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    if (!supabase) throw new Error('Supabase non configuré');
    
    // 1. Authentification Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('Authentification échouée');
    
    // 2. Récupérer les données utilisateur de la table users
    const foundUser = await dataAdapter.users.getById(authData.user.id);
    if (!foundUser) throw new Error('Utilisateur non trouvé');
    
    setUser(foundUser);
    localStorage.setItem(AUTH_STORAGE_KEY, foundUser.id);
    return foundUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // Optionnel : déconnexion Supabase
    if (supabase) {
      supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
