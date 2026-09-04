import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { mockFaydaAuthentication, type FaydaAuthenticationResult } from './services/faydaService';
import {
  clearFaydaVerification,
  FAYDA_VERIFICATION_KEY,
  readFaydaVerification,
  saveFaydaVerification,
  type FaydaVerification,
} from './faydaStorage';

// Fayda eKYC session state — the single owner of "who is verified" for the
// whole portal. Verification lives in sessionStorage (same-tab reload keeps
// it; a new window / fresh session starts unverified, matching the auth
// semantics), and every consumer (topbar chip, audit sign-off, review gate,
// vendor registration) reads from this one context.

export type FaydaContextValue = {
  verification: FaydaVerification | null;
  verify: (fin: string) => Promise<FaydaAuthenticationResult>;
  clearVerification: () => void;
};

export const FaydaContext = createContext<FaydaContextValue | null>(null);

export function FaydaProvider({ children }: { children: ReactNode }) {
  const [verification, setVerification] = useState<FaydaVerification | null>(() =>
    readFaydaVerification(window.sessionStorage),
  );

  // Cross-window sync: if another tab logs out / clears verification, drop the
  // in-memory state here too (mirrors the AuthContext storage listener).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === FAYDA_VERIFICATION_KEY) {
        setVerification(readFaydaVerification(window.sessionStorage));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const verify = useCallback(async (fin: string): Promise<FaydaAuthenticationResult> => {
    const result = await mockFaydaAuthentication(fin);
    if (result.ok) {
      const next: FaydaVerification = {
        fin,
        fullName: result.minimalData.fullName,
        address: result.minimalData.address,
        verifiedAt: new Date().toISOString(),
      };
      saveFaydaVerification(window.sessionStorage, next);
      setVerification(next);
    }
    return result;
  }, []);

  const clearVerification = useCallback(() => {
    clearFaydaVerification(window.sessionStorage);
    setVerification(null);
  }, []);

  const value = useMemo<FaydaContextValue>(
    () => ({ verification, verify, clearVerification }),
    [verification, verify, clearVerification],
  );

  return <FaydaContext.Provider value={value}>{children}</FaydaContext.Provider>;
}

export function useFayda(): FaydaContextValue {
  const ctx = useContext(FaydaContext);
  if (!ctx) {
    throw new Error('useFayda must be used inside <FaydaProvider>');
  }
  return ctx;
}

/** "···9012" style masking for display. */
export function maskFin(fin: string): string {
  return `···${fin.slice(-4)}`;
}