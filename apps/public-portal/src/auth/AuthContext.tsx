import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { can as canFn, mapUserRoleToRole, type Capability, type Role } from './roles';

// USER_KEY is used by the cross-window logout listener; the auth keys
// themselves (TOKEN_KEY/USER_KEY) are the single source of truth in ./authStorage.
const USER_KEY = 'ethiopia_ai_user_v1';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string; // backend UserRole
};

export type LoginResult = { ok: true } | { ok: false; error: string };

export type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  can: (action: Capability) => boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

// Storage rules live in ./authStorage (pure, unit-tested): auth persists in
// sessionStorage ONLY, legacy localStorage auth keys are purged on every read,
// and nothing else in localStorage is ever touched.
import { clearAuthSession, readStoredAuth, saveAuthSession, TOKEN_KEY } from './authStorage';

function readStored(): { user: AuthUser | null; token: string | null } {
  const { userRaw, token } = readStoredAuth(window.sessionStorage, window.localStorage);
  if (!userRaw || !token) return { user: null, token: null };
  try {
    return { user: JSON.parse(userRaw) as AuthUser, token };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [{ user, token }, setStored] = useState(() => readStored());

  // Cross-window logout: if another tab/window clears the storage, drop the in-memory state too.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY || e.key === USER_KEY) {
        setStored(readStored());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        return { ok: false, error: res.status === 401 ? 'Invalid credentials' : 'Login failed' };
      }
      const data = (await res.json()) as { accessToken: string; user: AuthUser };
      saveAuthSession(window.sessionStorage, JSON.stringify(data.user), data.accessToken);
      setStored({ user: data.user, token: data.accessToken });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'Network error' };
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthSession(window.sessionStorage, window.localStorage);
    setStored({ user: null, token: null });
  }, []);

  const role = useMemo<Role | null>(() => (user ? mapUserRoleToRole(user.role) : null), [user]);

  const can = useCallback((action: Capability) => canFn(role, action), [role]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      role,
      isAuthenticated: !!user && !!token,
      login,
      logout,
      can,
    }),
    [user, token, role, login, logout, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

// Small fetch wrapper that automatically attaches the Bearer token.
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = window.sessionStorage.getItem(TOKEN_KEY);
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(path, { ...init, headers });
}
