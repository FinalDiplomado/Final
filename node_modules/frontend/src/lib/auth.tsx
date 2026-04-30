import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from './api';

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  role: { name: 'ADMIN' | 'EVALUATOR' };
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

const storageKey = 'usability_eval_auth';

type StoredAuth = { token: string; user: AuthUser };

function loadStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const stored = loadStoredAuth();
  const [token, setToken] = useState<string | null>(stored?.token ?? null);
  const [user, setUser] = useState<AuthUser | null>(stored?.user ?? null);

  useEffect(() => {
    if (token && user) {
      localStorage.setItem(storageKey, JSON.stringify({ token, user } satisfies StoredAuth));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [token, user]);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      login: async (email, password) => {
        const res = await apiRequest<{ user: AuthUser; accessToken: string }>(
          '/auth/login',
          {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          },
        );
        setToken(res.accessToken);
        setUser(res.user);
      },
      register: async (email, password, fullName) => {
        const res = await apiRequest<{ user: AuthUser; accessToken: string }>(
          '/auth/register',
          {
            method: 'POST',
            body: JSON.stringify({ email, password, fullName }),
          },
        );
        setToken(res.accessToken);
        setUser(res.user);
      },
      logout: () => {
        setToken(null);
        setUser(null);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('AuthProvider is required');
  }
  return ctx;
}

