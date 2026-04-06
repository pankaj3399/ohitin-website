import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fetchAdminMe, getApiErrorMessage, loginAdmin } from '../api/admin';
import { clearStoredAdminToken, getStoredAdminToken, setStoredAdminToken } from './storage';
import type { AdminUser } from '../types';

interface LoginInput {
  username: string;
  password: string;
}

interface AuthContextValue {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  logout: () => void;
  refreshAdmin: () => Promise<AdminUser | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => getStoredAdminToken());
  const [isInitializing, setIsInitializing] = useState(true);

  const logout = useCallback(() => {
    clearStoredAdminToken();
    setToken(null);
    setAdmin(null);
    setIsInitializing(false);
  }, []);

  const refreshAdmin = useCallback(async () => {
    const storedToken = getStoredAdminToken();

    if (!storedToken) {
      setToken(null);
      setAdmin(null);
      setIsInitializing(false);
      return null;
    }

    setToken(storedToken);

    try {
      const nextAdmin = await fetchAdminMe();
      setAdmin(nextAdmin);
      return nextAdmin;
    } catch (error) {
      const message = getApiErrorMessage(error);

      if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('401')) {
        logout();
        return null;
      }

      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, [logout]);

  const login = useCallback(async (credentials: LoginInput) => {
    const response = await loginAdmin(credentials);
    setStoredAdminToken(response.token);
    setToken(response.token);
    setAdmin(response.admin);
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    void refreshAdmin().catch(() => {
      logout();
    });
  }, [logout, refreshAdmin]);

  const value = useMemo<AuthContextValue>(
    () => ({
      admin,
      token,
      isAuthenticated: Boolean(token),
      isInitializing,
      login,
      logout,
      refreshAdmin,
    }),
    [admin, token, isInitializing, login, logout, refreshAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAdminAuth must be used within an AuthProvider');
  }

  return context;
}
