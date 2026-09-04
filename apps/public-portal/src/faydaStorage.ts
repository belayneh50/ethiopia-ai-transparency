// Pure storage rules for the Fayda eKYC demo — no window/DOM access, so they
// are unit-testable in the plain node Vitest environment (faydaStorage.test.ts).
//
// Contract locked here:
//  - the verified identity lives in sessionStorage ONLY: a fresh window or a
//    fresh browser session starts unverified (matching the auth semantics),
//    while a same-tab reload keeps the verified identity;
//  - vendor registrations are Fayda-gated demo data and live in localStorage
//    (they are demo records, like the records/comparables keys);
//  - nothing else in storage is ever read, written, or removed.

export const FAYDA_VERIFICATION_KEY = 'ethiopia_ai_fayda_verification_v1';
export const VENDOR_KEY = 'ethiopia_ai_vendors_v1';

export type FaydaVerification = {
  fin: string;
  fullName: string;
  address: string;
  verifiedAt: string;
};

export type VendorRegistration = {
  id: string;
  company: string;
  contactName: string;
  contactFin: string;
  verifiedAt: string;
  registeredAt: string;
  bidSubmittedAt?: string;
};

// Minimal Storage surface; pass the real window storages from the context or
// any in-memory stand-in from tests.
export interface SimpleStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function safeRemove(storage: SimpleStorage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // storage unavailable (e.g. private mode) — ignore
  }
}

function safeRead<T>(storage: SimpleStorage, key: string): T | null {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeWrite(storage: SimpleStorage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // quota / unavailable — ignore, same as other demo storage
  }
}

/** Read the current session's verified identity (null when unverified). */
export function readFaydaVerification(session: SimpleStorage): FaydaVerification | null {
  return safeRead<FaydaVerification>(session, FAYDA_VERIFICATION_KEY);
}

/** Persist a successful Fayda verification into sessionStorage only. */
export function saveFaydaVerification(session: SimpleStorage, verification: FaydaVerification): void {
  safeWrite(session, FAYDA_VERIFICATION_KEY, verification);
}

/** Clear the session's verified identity (e.g. on logout). */
export function clearFaydaVerification(session: SimpleStorage): void {
  safeRemove(session, FAYDA_VERIFICATION_KEY);
}

/** Read the Fayda-gated vendor registrations (localStorage demo data). */
export function readVendors(local: SimpleStorage): VendorRegistration[] {
  const vendors = safeRead<VendorRegistration[]>(local, VENDOR_KEY);
  return Array.isArray(vendors) ? vendors : [];
}

/** Persist the vendor registrations list. */
export function saveVendors(local: SimpleStorage, vendors: VendorRegistration[]): void {
  safeWrite(local, VENDOR_KEY, vendors);
}