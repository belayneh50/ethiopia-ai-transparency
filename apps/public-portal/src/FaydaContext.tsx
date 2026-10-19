import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './auth/AuthContext';
import { mockFaydaAuthentication, type FaydaAuthenticationResult } from './services/faydaService';
import { clearFaydaVerification, createFaydaVerification, isCurrentVerification, readFaydaVerification, refreshFaydaActivity, saveFaydaVerification, type FaydaVerification } from './faydaStorage';
export type FaydaContextValue = {
  verification: FaydaVerification | null;
  verify: (fin: string) => Promise<FaydaAuthenticationResult>;
  clearVerification: () => void;
};
export const FaydaContext = createContext<FaydaContextValue | null>(null);
export function FaydaProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [stored, setStored] = useState(() => readFaydaVerification(window.sessionStorage));
  const generation = useRef(0);
  const currentToken = useRef(token);
  currentToken.current = token;
  const verification = isCurrentVerification(stored) && stored.userId === user?.id ? stored : null;
  const clearVerification = useCallback(() => {
    generation.current++;
    clearFaydaVerification(window.sessionStorage);
    setStored(null);
  }, []);
  useEffect(() => {
    if (!stored) return;
    if (!verification) { clearVerification(); return; }
    const timer = window.setTimeout(clearVerification, Math.max(0, Date.parse(verification.expiresAt) - Date.now()));
    return () => window.clearTimeout(timer);
  }, [stored, verification, clearVerification]);
  useEffect(() => {
    if (!verification) return;
    let lastRefresh = 0;
    const refreshActivity = () => {
      const now = Date.now();
      if (now - lastRefresh < 60_000) return;
      lastRefresh = now;
      setStored(current => {
        if (!isCurrentVerification(current, now)) return current;
        const next = refreshFaydaActivity(current, now);
        saveFaydaVerification(window.sessionStorage, next);
        return next;
      });
    };
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown'];
    events.forEach(event => window.addEventListener(event, refreshActivity));
    return () => events.forEach(event => window.removeEventListener(event, refreshActivity));
  }, [verification]);
  const verify = useCallback(async (fin: string): Promise<FaydaAuthenticationResult> => {
    clearVerification();
    const request = generation.current;
    const result = await mockFaydaAuthentication(fin);
    if (request !== generation.current || currentToken.current !== token || !user || !token) {
      return { ok: false, code: 'demo_only', message: 'Sign in and restart the demo verification.' };
    }
    if (result.ok) {
      const next = createFaydaVerification(user.id, result.minimalData);
      saveFaydaVerification(window.sessionStorage, next);
      setStored(next);
    }
    return result;
  }, [clearVerification, user, token]);
  return <FaydaContext.Provider value={{ verification, verify, clearVerification }}>{children}</FaydaContext.Provider>;
}
export function useFayda(): FaydaContextValue {
  const value = useContext(FaydaContext);
  if (!value) throw new Error('useFayda must be used inside <FaydaProvider>');
  return value;
}
/** Display a non-sensitive demo reference, never a national ID. */
export function maskFin(_subjectId: string): string { return 'DEMO'; }
