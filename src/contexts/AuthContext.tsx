import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { dataAdapter, type User } from '../lib/data';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'graphotherapie_auth_user_id';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  const login = async (email: string): Promise<User> => {
    const foundUser = await dataAdapter.users.getByEmail(email);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem(AUTH_STORAGE_KEY, foundUser.id);
      return foundUser;
    } else {
      throw new Error('Utilisateur non trouvé');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
